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
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SyncIcon from '@mui/icons-material/Sync';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { featureService } from '../services/api';

interface StatisticalInsightsViewProps {
    repoUrl: string;
    branch: string;
    onBack: () => void;
    onSync: () => void;
    onViewChange: (view: any) => void;
}

export const EngineeringInsightsView: React.FC<StatisticalInsightsViewProps> = ({ repoUrl, branch, onBack, onSync, onViewChange }) => {
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
                    <Box sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.3)'
                    }}>
                        <ScienceIcon sx={{ fontSize: 32 }} />
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
                            <Tooltip
                                arrow
                                placement="top-start"
                                title={
                                    <Box sx={{ p: 1.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Performance Anomalies (Z-Score)</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                            <strong>Goal:</strong> Detect when a step is "unusually" slow, even if it hasn't timed out yet.
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                            <strong>How it works:</strong> We track the last 20 runs. The Z-Score tells us how many "standard deviations" a run is from the average.
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                            <strong>Example:</strong> Avg: 2.0s, StdDev: 0.2s, Current: 3.5s. <br />
                                            <strong>Calculation:</strong> (3.5 - 2.0) / 0.2 = <strong>7.5</strong>
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                            <strong>Insight:</strong> A Z-Score of 7.5 is massive. Your system flags this because it is statistically impossible for this to happen by chance, suggesting a backend leak or DB lock.
                                        </Typography>
                                    </Box>
                                }
                                slotProps={{ tooltip: { sx: { bgcolor: '#1e293b', maxWidth: 350, borderRadius: '12px' } } }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                                    <Box sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '12px',
                                        bgcolor: 'rgba(99, 102, 241, 0.08)',
                                        color: '#6366f1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(99, 102, 241, 0.1)'
                                    }}>
                                        <SpeedIcon sx={{ fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>Performance Anomalies</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>Z-Score outlier detection (sigma {'>'} 1.5)</Typography>
                                    </Box>
                                </Box>
                            </Tooltip>
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
                                                    label={`${a.zScore > 0 ? '+' : ''}${a.zScore} sigma`}
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
                            <Tooltip
                                arrow
                                placement="top-start"
                                title={
                                    <Box sx={{ p: 1.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Stability Significance (Chi-Squared)</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                            <strong>Goal:</strong> Determine if a change in pass rate is a "real bug" or just "normal flakiness."
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                            <strong>How it works:</strong> Compares Observed results vs. Expected results to see if the difference is "statistically significant."
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                            <strong>Insight:</strong> If p {"<"} 0.05, there is a 95% chance a code change broke something. If p {">"} 0.05, it's likely just "noise" from the environment.
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, p: 1, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: '4px', color: '#4ade80' }}>
                                            Actionable: Reduces false-positive alerts by only pinging when the math proves a real trend.
                                        </Typography>
                                    </Box>
                                }
                                slotProps={{ tooltip: { sx: { bgcolor: '#1e293b', maxWidth: 350, borderRadius: '12px' } } }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                                    <Box sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '12px',
                                        bgcolor: 'rgba(34, 197, 94, 0.08)',
                                        color: '#22c55e',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(34, 197, 94, 0.1)'
                                    }}>
                                        <MonitorHeartIcon sx={{ fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>Stability Significance</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>Chi-Squared test for reliability drift</Typography>
                                    </Box>
                                </Box>
                            </Tooltip>
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



                {/* 4. Risk Forecasting (Bayesian) */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Tooltip
                                arrow
                                placement="top-start"
                                title={
                                    <Box sx={{ p: 1.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Predictive Risk (Bayesian Inference)</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                            <strong>Goal:</strong> Predict the probability that your next build will fail before you even run it.
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                            <strong>How it works:</strong> Uses Bayesian prior (past failure rates) and Likelihood (performance under similar conditions) with Laplace Smoothing (+1 correction).
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                            <strong>Laplace Calculation:</strong> (Failures + 1) / (Total Runs + 2)
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                            <strong>Actionable:</strong> If probability jumps (e.g., to 60%), the pipeline might block merges or trigger stability scripts.
                                        </Typography>
                                    </Box>
                                }
                                slotProps={{ tooltip: { sx: { bgcolor: '#1e293b', maxWidth: 350, borderRadius: '12px' } } }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                                    <Box sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '12px',
                                        bgcolor: 'rgba(239, 68, 68, 0.08)',
                                        color: '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(239, 68, 68, 0.1)'
                                    }}>
                                        <AutoGraphIcon sx={{ fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>Risk Forecasting</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>Bayesian Failure Probability (P-Risk)</Typography>
                                    </Box>
                                </Box>
                            </Tooltip>
                        </Box>

                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4, bgcolor: '#fef2f2', borderRadius: '16px', border: '1px dashed #fee2e2' }}>
                            <AutoGraphIcon sx={{ fontSize: 40, color: '#fca5a5' }} />
                            <Box sx={{ textAlign: 'center', px: 3 }}>
                                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                                    Predict the probability of failure for your next build using Bayesian Inference modeling.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    onClick={() => onViewChange('risk-forecasting')}
                                    sx={{
                                        borderRadius: '10px',
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        borderColor: '#ef4444',
                                        color: '#ef4444',
                                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.05)', borderColor: '#dc2626' }
                                    }}
                                >
                                    Risk Forecasting Deep Dive
                                </Button>
                            </Box>
                        </Box>
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
