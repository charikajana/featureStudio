package com.editor.backend.controller;

import com.editor.backend.dto.AuthRequest;
import com.editor.backend.dto.SettingsRequest;
import com.editor.backend.model.GitRepository;
import com.editor.backend.model.User;
import com.editor.backend.repository.GitRepositoryRepository;
import com.editor.backend.repository.UserRepository;
import com.editor.backend.service.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final GitRepositoryRepository gitRepoRepository;
    private final PasswordEncoder passwordEncoder;
    private final EncryptionService encryptionService;
    private final RestTemplate restTemplate = new RestTemplate();

    @org.springframework.beans.factory.annotation.Value("${app.github.api-url}")
    private String githubApiUrl;

    @PostMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        boolean exists = userRepository.existsByEmail(email);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody AuthRequest request) {
        try {
            // 1. Basic validation
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body("User already exists");
            }

            // 2. Validate GitHub Token (Only if provided)
            if (request.getGithubToken() != null && !request.getGithubToken().isEmpty()) {
                if (!validateGithubToken(request.getGithubToken())) {
                    return ResponseEntity.badRequest().body("Invalid GitHub Access Token");
                }
            }

            // 3. Create User
            User user = new User();
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            if (request.getGithubToken() != null && !request.getGithubToken().isEmpty()) {
                user.setGithubToken(encryptionService.encrypt(request.getGithubToken()));
            }
            
            userRepository.save(user);
            return ResponseEntity.ok("User registered successfully");
        } catch (Exception e) {
            log.error("Registration error", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent() && passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            // In a real app, we would return a JWT. For now, we'll return the email as a "token".
            return ResponseEntity.ok(Map.of(
                "email", userOpt.get().getEmail(),
                "message", "Login successful"
            ));
        }
        return ResponseEntity.status(401).body("Invalid email or password");
    }

    @GetMapping("/settings")
    public ResponseEntity<SettingsRequest> getSettings(@RequestHeader("X-Username") String username) {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        SettingsRequest settings = new SettingsRequest();
        settings.setGithubToken(""); // Don't return secret
        settings.setAzurePat(""); // Don't return secret
        settings.setAzureOrg(user.getAzureOrg());
        settings.setAzureProject(user.getAzureProject());
        settings.setAzurePipelineId(user.getAzurePipelineId());
        
        return ResponseEntity.ok(settings);
    }

    @PostMapping("/settings")
    public ResponseEntity<String> updateSettings(@RequestHeader("X-Username") String username,
                                               @RequestBody SettingsRequest request) {
        try {
            log.info("Updating settings for user: {}", username);
            
            User user = userRepository.findByEmail(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // 1. Handle GitHub Token Update
            if (request.getGithubToken() != null && !request.getGithubToken().isEmpty()) {
                if (!validateGithubToken(request.getGithubToken())) {
                    log.warn("Provided GitHub token failed validation, saving anyway.");
                }
                String encryptedToken = encryptionService.encrypt(request.getGithubToken());
                user.setGithubToken(encryptedToken);
                
                // Propagate to repos
                java.util.List<GitRepository> repos = gitRepoRepository.findByUsername(username);
                for (GitRepository repo : repos) {
                    repo.setPersonalAccessToken(encryptedToken);
                    gitRepoRepository.save(repo);
                }
            }

            // 2. Handle Azure DevOps Update
            if (request.getAzurePat() != null && !request.getAzurePat().isEmpty()) {
                user.setAzurePat(encryptionService.encrypt(request.getAzurePat()));
            }
            if (request.getAzureOrg() != null) user.setAzureOrg(request.getAzureOrg());
            if (request.getAzureProject() != null) user.setAzureProject(request.getAzureProject());
            if (request.getAzurePipelineId() != null) user.setAzurePipelineId(request.getAzurePipelineId());

            userRepository.save(user);

            log.info("Successfully updated settings for user: {}", username);
            return ResponseEntity.ok("Settings updated successfully");
        } catch (Exception e) {
            log.error("Error updating settings", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    private boolean validateGithubToken(String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "token " + token);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            restTemplate.exchange(githubApiUrl + "/user", HttpMethod.GET, entity, Object.class);
            return true;
        } catch (Exception e) {
            log.warn("Github token validation failed: {}", e.getMessage());
            return false;
        }
    }
}
