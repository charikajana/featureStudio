package com.editor.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Service
@Slf4j
public class SuggestionService {

    // Regex to match Given/When/Then steps in feature files
    private static final Pattern STEP_PATTERN = Pattern.compile("^(?:Given|When|Then|And|But)\\s+(.*)$", Pattern.MULTILINE);

    public Set<String> discoverSteps(String repoPath) {
        Set<String> steps = new HashSet<>();
        try (Stream<Path> paths = Files.walk(Paths.get(repoPath))) {
            paths.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".feature"))
                    .forEach(p -> {
                        try {
                            String content = Files.readString(p);
                            Matcher matcher = STEP_PATTERN.matcher(content);
                            while (matcher.find()) {
                                steps.add(matcher.group(1).trim());
                            }
                        } catch (IOException e) {
                            log.warn("Could not read feature file for suggestions: {}", p);
                        }
                    });
        } catch (IOException e) {
            log.error("Error walking file tree for suggestions", e);
        }
        return steps;
    }
}
