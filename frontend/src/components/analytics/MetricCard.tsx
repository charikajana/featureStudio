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
            p: 2.2,
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'white',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
            }
        }}>
            <Box sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                bgcolor: `${color}10`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                <Icon sx={{ fontSize: '1.2rem' }} />
            </Box>
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 950, color: '#0f172a', lineHeight: 1.1, fontSize: '1.2rem' }}>{value}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.62rem', display: 'block', mt: 0.2 }}>{label}</Typography>
                {sub && <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.62rem', fontWeight: 500 }}>{sub}</Typography>}
            </Box>
        </Paper>
    );
};
