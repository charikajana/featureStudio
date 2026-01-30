import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface MetricCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    color: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub, icon: Icon, color }) => {
    return (
        <Paper sx={{
            p: 2.5,
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 2.2,
            bgcolor: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                borderColor: color
            },
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                bgcolor: color,
                opacity: 0.8
            }
        }}>
            <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '16px',
                bgcolor: `${color}10`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `1px solid ${color}20`,
                boxShadow: `0 4px 12px ${color}15`
            }}>
                <Icon sx={{ fontSize: '1.4rem' }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 950, color: '#0f172a', lineHeight: 1.1, fontSize: '1.35rem' }}>{value}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '0.65rem', display: 'block', mt: 0.5 }}>{label}</Typography>
                {sub && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#94a3b8',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.2
                        }}
                    >
                        {sub}
                    </Typography>
                )}
            </Box>
            {/* Corner Accent */}
            <Box sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                width: 40,
                height: 40,
                bgcolor: `${color}05`,
                borderRadius: '50%',
                zIndex: 0
            }} />
        </Paper>
    );
};
