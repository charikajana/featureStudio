import { motion } from 'framer-motion';
import { Box, CircularProgress, Typography } from '@mui/material';

interface PremiumLoadingProps {
    message?: string;
}

export const PremiumLoading = ({ message = 'PROCESSING...' }: PremiumLoadingProps) => {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(8px) saturate(180%)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3
            }}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1]
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {/* Outer glow ring */}
                    <Box
                        sx={{
                            position: 'absolute',
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }}
                    />

                    {/* Main spinner */}
                    <CircularProgress
                        thickness={5}
                        size={56}
                        sx={{
                            color: '#2563eb',
                            '& .MuiCircularProgress-circle': {
                                strokeLinecap: 'round',
                            }
                        }}
                    />
                </Box>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.4,
                    delay: 0.1,
                    ease: [0.4, 0, 0.2, 1]
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 700,
                        color: '#3730a3',
                        letterSpacing: '2px',
                        fontSize: '0.85rem',
                        textTransform: 'uppercase',
                        background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                >
                    {message}
                </Typography>
            </motion.div>

            {/* Floating dots */}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                        }}
                        animate={{
                            y: [0, -12, 0],
                            opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: 'easeInOut'
                        }}
                    />
                ))}
            </Box>
        </Box>
    );
};
