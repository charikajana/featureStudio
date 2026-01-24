import { useState } from 'react';
import type { FC } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stepper,
    Step,
    StepLabel,
    Alert,
    CircularProgress
} from '@mui/material';
import { featureService } from '../services/api';

interface LoginProps {
    onLoginSuccess: (email: string) => void;
}

const steps = ['Email Address', 'Password'];

export const Login: FC<LoginProps> = ({ onLoginSuccess }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleNext = async () => {
        if (!email) return;
        setError('');
        setLoading(true);
        try {
            if (activeStep === 0) {
                const { data } = await featureService.checkEmail(email);
                setIsNewUser(!data.exists);
                setActiveStep(1);
            } else if (activeStep === 1) {
                if (isNewUser) {
                    if (password !== confirmPassword) {
                        throw new Error('Passwords do not match');
                    }
                    if (password.length < 6) {
                        throw new Error('Password must be at least 6 characters');
                    }
                    // Register without token
                    await featureService.register({ email, password });
                    onLoginSuccess(email);
                } else {
                    // Login
                    await featureService.login({ email, password });
                    onLoginSuccess(email);
                }
            }
        } catch (e: any) {
            setError(e.response?.data || e.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            overflow: 'hidden'
        }}>
            {/* Company Header */}
            <Box sx={{
                p: 2,
                px: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                {/* Logo Icon */}
                <Box sx={{
                    width: 32,
                    height: 32,
                    bgcolor: '#6366f1', // Changed to match indigo theme
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: 20
                }}>
                    F
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: -0.5 }}>
                    Feature Studio
                </Typography>
            </Box>

            {/* Centered Login Card Container */}
            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 3
            }}>
                <Paper elevation={3} sx={{ p: 5, width: '100%', maxWidth: 480, borderRadius: 3, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}>
                    <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 800, color: 'primary.main', mb: 4, letterSpacing: '-1px' }}>
                        Welcome to Feature Studio
                    </Typography>

                    {activeStep === 1 && (
                        <Stepper activeStep={activeStep} sx={{ py: 2, mb: 4 }}>
                            {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                        </Stepper>
                    )}

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    <Box sx={{ mt: 2 }}>
                        {activeStep === 0 && (
                            <TextField
                                fullWidth
                                label="Email Address"
                                variant="outlined"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your enterprise email"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleNext();
                                }}
                            />
                        )}

                        {activeStep === 1 && (
                            <Box>
                                <TextField
                                    fullWidth
                                    label={isNewUser ? "Select Password" : "Password"}
                                    type="password"
                                    variant="outlined"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    sx={{ mb: 2 }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleNext();
                                    }}
                                />
                                {isNewUser && (
                                    <TextField
                                        fullWidth
                                        label="Confirm Password"
                                        type="password"
                                        variant="outlined"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleNext();
                                        }}
                                    />
                                )}
                            </Box>
                        )}

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleNext}
                            disabled={loading || !email}
                            sx={{ mt: 4, py: 1.5, borderRadius: 2, fontSize: '1rem' }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : (
                                activeStep === 0 ? 'Continue' :
                                    isNewUser ? 'Create Account' : 'Sign In'
                            )}
                        </Button>

                        {activeStep > 0 && (
                            <Button
                                fullWidth
                                variant="text"
                                onClick={() => setActiveStep(activeStep - 1)}
                                sx={{ mt: 2, color: 'text.secondary' }}
                            >
                                Back
                            </Button>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};
