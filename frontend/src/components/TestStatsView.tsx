import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    CircularProgress,
    Card,
    CardContent,
    alpha
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ChecklistIcon from '@mui/icons-material/Checklist';
import FootprintsIcon from '@mui/icons-material/DirectionsWalk';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { featureService } from '../services/api';

interface TestStatsViewProps {
    repoUrl: string;
    branch?: string;
}

export const TestStatsView: FC<TestStatsViewProps> = ({ repoUrl, branch }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const { data } = await featureService.getTestStats(repoUrl, branch);
                setStats(data);
            } catch (error) {
                console.error('Error fetching test stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (repoUrl) {
            fetchStats();
        }
    }, [repoUrl, branch]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!stats) return null;

    const statCards = [
        { label: 'Feature Files', value: stats.totalFeatures, icon: <DescriptionIcon />, color: '#6366f1' },
        { label: 'Scenarios', value: stats.totalScenarios, icon: <FlashOnIcon />, color: '#f59e0b' },
        { label: 'Scenario Outlines', value: stats.totalScenarioOutlines, icon: <ListAltIcon />, color: '#10b981' },
        { label: 'Total Test Cases', value: stats.totalTests, icon: <ChecklistIcon />, color: '#ef4444' },
        { label: 'Total Steps', value: stats.totalSteps, icon: <FootprintsIcon />, color: '#8b5cf6' }
    ];

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', letterSpacing: '-1px', mb: 0.5 }}>
                        Test Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ListAltIcon sx={{ fontSize: 16 }} />
                        Real-time BDD metrics from your repository
                    </Typography>
                </Box>

                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1,
                    bgcolor: 'white',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}>
                    <AccountTreeIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                    <Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, display: 'block', lineHeight: 1, mb: 0.5, letterSpacing: '0.5px' }}>
                            ACTIVE BRANCH
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700, lineHeight: 1 }}>
                            {branch || 'main'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {statCards.map((card, idx) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                        <Card
                            elevation={0}
                            sx={{
                                border: '1px solid #e5e7eb',
                                borderRadius: 4,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)',
                                    borderColor: card.color
                                }
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    <Box sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        bgcolor: alpha(card.color, 0.1),
                                        color: card.color,
                                        display: 'flex'
                                    }}>
                                        {card.icon}
                                    </Box>
                                    <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>
                                        {card.label}
                                    </Typography>
                                </Box>
                                <Typography variant="h3" sx={{ fontWeight: 800, color: '#111827' }}>
                                    {card.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Paper sx={{ mt: 4, p: 4, borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Summary & Insights</Typography>
                <Typography variant="body1" color="text.secondary">
                    Your repository on branch <strong>{branch || 'default'}</strong> currently contains <strong>{stats.totalTests} individual test executions</strong> spread across <strong>{stats.totalFeatures} feature files</strong>.
                    The high count of steps (<strong>{stats.totalSteps}</strong>) relative to scenarios suggests a descriptive BDD implementation on this branch.
                </Typography>
            </Paper>
        </Box>
    );
};
