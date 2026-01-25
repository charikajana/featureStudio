import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    CircularProgress,
    IconButton,
    Chip,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import SpeedIcon from '@mui/icons-material/Speed';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import LayersIcon from '@mui/icons-material/Layers';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SyncIcon from '@mui/icons-material/Sync';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { featureService } from '../services/api';

interface StatisticalInsightsViewProps {
    repoUrl: string;
    branch: string;
    onBack: () => void;
    onSync: () => void;
}

export const EngineeringInsightsView: React.FC<StatisticalInsightsViewProps> = ({ repoUrl, branch, onBack, onSync }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await featureService.getAnalytics(repoUrl, branch);
            setData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [repoUrl, branch]);

    if (loading) {
        return (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, height: '100%', overflowY: 'auto', bgcolor: '#f8fafc' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={onBack} sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f1f5f9' } }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: '#0f172a', color: 'white' }}>
                        <ScienceIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px', color: '#0f172a' }}>
                            Engineering Intelligence
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                            Statistical diagnostics and predictive test modeling
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<SyncIcon />}
                    onClick={onSync}
                    sx={{ borderRadius: '12px', px: 3, py: 1, bgcolor: '#0f172a', fontWeight: 800, textTransform: 'none' }}
                >
                    Sync Intelligence
                </Button>
            </Box>

            <Grid container spacing={4}>
                {/* 1. Performance Anomalies (Z-Score) */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                <SpeedIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>Performance Anomalies</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>Z-Score outlier detection (σ {'>'} 1.5)</Typography>
                            </Box>
                        </Box>

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Scenario</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Z-Score</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Avg Time</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.performanceAnomalies?.map((a: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{a.scenarioName}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={`${a.zScore > 0 ? '+' : ''}${a.zScore}σ`}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 800,
                                                        bgcolor: Math.abs(a.zScore) > 2 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: Math.abs(a.zScore) > 2 ? '#ef4444' : '#f59e0b'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 900 }}>{(a.averageDurationMillis / 1000).toFixed(1)}s</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!data?.performanceAnomalies?.length) && (
                                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: '#94a3b8' }}>No deviations detected in recent runs</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* 2. Stability Significance (Chi-Squared) */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                                <MonitorHeartIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>Stability Significance</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>Chi-Squared test for reliability drift</Typography>
                            </Box>
                        </Box>

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Scenario</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 800, borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Drift</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Confidence</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.stabilitySignificance?.map((s: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.scenarioName}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Typography variant="body2" sx={{ fontWeight: 900, color: s.stabilityChange > 0 ? '#22c55e' : '#ef4444' }}>
                                                    {s.stabilityChange > 0 ? '+' : ''}{s.stabilityChange}%
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>
                                                    p = {s.pValue}
                                                </Typography>
                                                <Box sx={{ height: 4, width: 40, bgcolor: '#f1f5f9', borderRadius: 2, mt: 0.5, ml: 'auto' }}>
                                                    <Box sx={{ height: '100%', width: '95%', bgcolor: '#22c55e', borderRadius: 2 }} />
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!data?.stabilitySignificance?.length) && (
                                        <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: '#94a3b8' }}>Stable reliability across all segments</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* 3. Efficiency Library (Pareto 80/20) */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                <LayersIcon />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>Pareto Efficiency</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>Identification of "Vital Few" steps</Typography>
                            </Box>
                            <Tooltip title="80% of your scenarios are covered by only a few core steps. These are the highest ROI components to optimize.">
                                <InfoIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                            </Tooltip>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>Component Coverage Curve (Cumulative)</Typography>
                            <Box sx={{ height: 8, width: '100%', bgcolor: '#f1f5f9', borderRadius: 4, mt: 1, overflow: 'hidden', display: 'flex' }}>
                                <Box sx={{ height: '100%', width: '20%', bgcolor: '#f59e0b' }} />
                                <Box sx={{ height: '100%', width: '60%', bgcolor: 'rgba(245, 158, 11, 0.4)' }} />
                                <Box sx={{ height: '100%', width: '20%', bgcolor: 'rgba(245, 158, 11, 0.1)' }} />
                            </Box>
                        </Box>

                        <TableContainer sx={{ maxHeight: 300 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, bgcolor: 'white', color: '#94a3b8', fontSize: '0.65rem' }}>Core Step</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'white', color: '#94a3b8', fontSize: '0.65rem' }}>Coverage</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.paretoEfficiency?.map((p: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" sx={{
                                                    fontWeight: p.isInTop20 ? 800 : 500,
                                                    color: p.isInTop20 ? '#0f172a' : '#64748b',
                                                    fontFamily: 'JetBrains Mono'
                                                }}>
                                                    {p.stepText}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 900 }}>{p.cumulativePercentage}%</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* 4. Risk Forecasting (Bayesian) */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                <AutoGraphIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>Risk Forecasting</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>Bayesian Failure Probability (P-Risk)</Typography>
                            </Box>
                        </Box>

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 800, borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Target Scenario</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Failure Likelihood</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data?.predictiveRisk?.map((r: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.scenarioName}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                                    <Typography variant="body2" sx={{
                                                        fontWeight: 900,
                                                        color: r.riskLevel === 'High' ? '#ef4444' : (r.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e')
                                                    }}>
                                                        {r.failureProbability}%
                                                    </Typography>
                                                    <Box sx={{ width: 80, height: 6, bgcolor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                                                        <Box sx={{
                                                            height: '100%',
                                                            width: `${r.failureProbability}%`,
                                                            bgcolor: r.riskLevel === 'High' ? '#ef4444' : (r.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e')
                                                        }} />
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Footer Methodology Box */}
            <Paper sx={{ mt: 4, p: 3, borderRadius: '24px', bgcolor: '#0f172a', color: 'white' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Methodology Note</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, lineHeight: 1.5, display: 'block' }}>
                    These insights are generated using advanced engineering intelligence. Performance anomalies use Z-Score normalization on a rolling 20-run window.
                    Stability significance employs Chi-squared testing to validate if pass-rate changes are statistically relevant.
                    Pareto efficiency identifies the Vital Few steps that provide the highest ROI for testing.
                    Predictive risk is calculated using Bayesian inference with Laplace smoothing to output the real-time probability of failure for your next build.
                </Typography>
            </Paper>
        </Box>
    );
};
