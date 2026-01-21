import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    CircularProgress,
    alpha,
    Chip,
    Button
} from '@mui/material';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import HistoryIcon from '@mui/icons-material/History';
import LaunchIcon from '@mui/icons-material/Launch';
import SecurityIcon from '@mui/icons-material/Security';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { featureService } from '../services/api';

interface TestStatsViewProps {
    repoUrl: string;
    branch?: string;
    onViewAllScenarios?: (filter?: "all" | "flaky") => void;
}

export const TestStatsView: FC<TestStatsViewProps> = ({ repoUrl, branch, onViewAllScenarios }) => {
    const [stats, setStats] = useState<any>(null);
    const [stability, setStability] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [hoveredFlakyIndex, setHoveredFlakyIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [statsRes, stabilityRes] = await Promise.all([
                    featureService.getTestStats(repoUrl, branch),
                    featureService.getStabilityStats(repoUrl, branch)
                ]);
                setStats(statsRes.data);
                setStability(stabilityRes.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (repoUrl) {
            fetchData();
        }
    }, [repoUrl, branch]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress thickness={5} size={60} sx={{ color: '#6366f1' }} />
            </Box>
        );
    }

    if (!stats) return null;

    const getBuildUrl = (runId: number) => {
        if (!repoUrl) return "#";
        const baseUrl = repoUrl.split('/_git/')[0];
        return `${baseUrl}/_build/results?buildId=${runId}`;
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', mb: 0.5 }}>
                        Quality Insights
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon sx={{ color: '#10b981', fontSize: 18 }} />
                        Real-time stability metrics for <span style={{ color: '#0f172a', fontWeight: 800 }}>{branch || 'main'}</span>
                    </Typography>
                </Box>

                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1,
                    bgcolor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}>
                    <AccountTreeIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                    <Box>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, display: 'block', mb: 0, letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                            GIT CONTEXT
                        </Typography>
                        <Typography variant="subtitle2" sx={{ color: '#1e293b', fontWeight: 800, lineHeight: 1 }}>
                            {branch || 'main'}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {/* Main Content Area - Full Width */}
                <Grid size={{ xs: 12 }}>
                    {/* AUTOMATION RELIABILITY HUB - NOW AT TOP */}
                    <Grid container spacing={3} sx={{ mb: 3, alignItems: 'stretch' }}>
                        <Grid size={{ xs: 12, md: 9 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Paper elevation={0} sx={{
                                p: 3, borderRadius: 5, border: '1px solid #e2e8f0', bgcolor: 'white',
                                position: 'relative', overflow: 'hidden',
                                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                                display: 'flex', flexDirection: 'column', minHeight: 320
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ flex: 1 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ p: 1, bgcolor: alpha('#6366f1', 0.1), borderRadius: 2 }}>
                                            <HistoryIcon sx={{ color: '#6366f1' }} />
                                        </Box>
                                        <Box sx={{ textAlign: 'left' }}>
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                                                Reliability Hub
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                                                Health: last {stability?.executionHistory?.length || 0} cycles
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() => onViewAllScenarios?.('all')}
                                            sx={{ fontWeight: 800, textTransform: 'none', color: '#6366f1', fontSize: '0.75rem' }}
                                            endIcon={<LaunchIcon sx={{ fontSize: 14 }} />}
                                        >
                                            Deep Dive
                                        </Button>
                                    </Box>
                                </Box>

                                <Grid container spacing={3} alignItems="center">
                                    <Grid size={{ xs: 12, sm: 3 }}>
                                        <Box sx={{ textAlign: 'center', p: 1, borderRight: { sm: '1px solid #e2e8f0' } }}>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                                                Stability
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5, my: 0.5 }}>
                                                <Typography variant="h3" sx={{ fontWeight: 900, color: '#1e293b' }}>
                                                    {stability?.overallStabilityScore || 0}
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#94a3b8' }}>%</Typography>
                                            </Box>
                                            <Chip
                                                label={stability?.overallStabilityScore > 90 ? "Healthy" : stability?.overallStabilityScore > 70 ? "Stable" : "Critical"}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800, height: 20, fontSize: '0.65rem',
                                                    bgcolor: stability?.overallStabilityScore > 90 ? '#dcfce7' : stability?.overallStabilityScore > 70 ? '#fef9c3' : '#fee2e2',
                                                    color: stability?.overallStabilityScore > 90 ? '#166534' : stability?.overallStabilityScore > 70 ? '#854d0e' : '#991b1b',
                                                    borderRadius: 1.5, mb: 1
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: '0.7rem' }}>
                                                {stability?.overallStabilityScore > 90 ? "Reliable" : stability?.overallStabilityScore > 70 ? "Moderate" : "Frequent Failure"}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 9 }}>
                                        <Box sx={{ width: '100%', height: 140, position: 'relative' }}>
                                            <Box sx={{ pt: 2, width: '100%', height: '100%' }}>
                                                {stability?.executionHistory && (stability.executionHistory as any[]).length > 0 ? (
                                                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                                        {hoveredIndex !== null && (
                                                            <Paper sx={{
                                                                position: 'absolute',
                                                                left: `${(hoveredIndex / ((stability.executionHistory as any[]).length - 1)) * 100}%`,
                                                                top: (100 - ((stability.executionHistory as any[])[hoveredIndex].passRate)) + '%',
                                                                transform: 'translate(-50%, -120%)',
                                                                bgcolor: '#1e293b', color: 'white', px: 1, py: 0.5, borderRadius: 1.5,
                                                                zIndex: 10, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                                                                pointerEvents: 'none', textAlign: 'center'
                                                            }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.6rem', color: '#818cf8', display: 'block' }}>
                                                                    Build #{(stability.executionHistory as any[])[hoveredIndex].runId}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'white', display: 'block' }}>
                                                                    {(stability.executionHistory as any[])[hoveredIndex].passRate}%
                                                                </Typography>
                                                            </Paper>
                                                        )}

                                                        <svg width="100%" height="100%" viewBox="-20 0 420 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                                            <defs>
                                                                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                                                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                                                </linearGradient>
                                                            </defs>
                                                            {/* Y-axis labels */}
                                                            {[0, 20, 40, 60, 80, 100].map((tick) => (
                                                                <g key={tick}>
                                                                    <line x1="-5" y1={100 - tick} x2="0" y2={100 - tick} stroke="#cbd5e1" strokeWidth="1" />
                                                                    <text x="-10" y={100 - tick} fontSize="8" fill="#94a3b8" textAnchor="end" dominantBaseline="middle">{tick}%</text>
                                                                </g>
                                                            ))}
                                                            <path
                                                                d={`M 0,${100 - ((stability.executionHistory as any[])[0].passRate)} ${(stability.executionHistory as any[]).map((v: any, i: number) =>
                                                                    `L ${(i / ((stability.executionHistory as any[]).length - 1)) * 400},${100 - v.passRate}`
                                                                ).join(' ')} L 400,100 L 0,100 Z`}
                                                                fill="url(#areaGradient)"
                                                            />
                                                            <path
                                                                d={`M 0,${100 - ((stability.executionHistory as any[])[0].passRate)} ${(stability.executionHistory as any[]).map((v: any, i: number) =>
                                                                    `L ${(i / ((stability.executionHistory as any[]).length - 1)) * 400},${100 - v.passRate}`
                                                                ).join(' ')}`}
                                                                fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                                            />
                                                            {(stability.executionHistory as any[]).map((v: any, i: number) => (
                                                                <g key={i}>
                                                                    {hoveredIndex === i && (
                                                                        <line x1={(i / ((stability.executionHistory as any[]).length - 1)) * 400} y1="0" x2={(i / ((stability.executionHistory as any[]).length - 1)) * 400} y2="100" stroke="#6366f1" strokeWidth="1" strokeDasharray="4" />
                                                                    )}
                                                                    <circle
                                                                        cx={(i / ((stability.executionHistory as any[]).length - 1)) * 400}
                                                                        cy={100 - v.passRate}
                                                                        r={hoveredIndex === i ? "5" : "3"}
                                                                        fill="white" stroke="#6366f1" strokeWidth={hoveredIndex === i ? "3" : "2"}
                                                                    />
                                                                    <rect
                                                                        x={((i / ((stability.executionHistory as any[]).length - 1)) * 400) - 15}
                                                                        y="0" width="30" height="100" fill="transparent"
                                                                        onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}
                                                                        onClick={() => window.open(getBuildUrl(v.runId), '_blank')}
                                                                        style={{ cursor: 'pointer' }}
                                                                    />
                                                                </g>
                                                            ))}
                                                        </svg>
                                                    </Box>
                                                ) : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.75rem' }}>No trend data</Box>}
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 'auto', pt: 3, borderTop: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic', display: 'block', textAlign: 'center', lineHeight: 1.6 }}>
                                        💡 Stability above 90% ensures predictable deployments and team confidence
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Paper sx={{ p: 3, borderRadius: 5, bgcolor: '#eff6ff', border: '1px solid #dbeafe', height: '100%', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#2563eb' }}>
                                    <HistoryIcon sx={{ fontSize: 20 }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>How Stability works</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#1d4ed8', display: 'block', mb: 0.5 }}>PER SCENARIO ANALYSIS</Typography>
                                        <Typography variant="body2" sx={{ color: '#1e40af', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5 }}>
                                            The system analyzes the latest 10 executions for every single test scenario in your project.
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#1d4ed8', display: 'block', mb: 0.5 }}>SUCCESS RATE</Typography>
                                        <Typography variant="body2" sx={{ color: '#1e40af', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5 }}>
                                            If a scenario passed 5 out of the last 10 times, its individual stability is marked as 50%.
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#1d4ed8', display: 'block', mb: 0.5 }}>AGGREGATED AVERAGE</Typography>
                                        <Typography variant="body2" sx={{ color: '#1e40af', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5 }}>
                                            The Project Stability is the average health score calculated across all scenarios.
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* FLAKY RISK HUB - NOW AT BOTTOM */}
                    <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                        <Grid size={{ xs: 12, md: 9 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Paper elevation={0} sx={{
                                p: 3, borderRadius: 5, border: '1px solid #e2e8f0', bgcolor: 'white',
                                position: 'relative', overflow: 'hidden',
                                background: 'linear-gradient(180deg, #ffffff 0%, #fffbfb 100%)',
                                display: 'flex', flexDirection: 'column', minHeight: 320
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ flex: 1 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ p: 1, bgcolor: alpha('#ef4444', 0.1), borderRadius: 2 }}>
                                            <SentimentVeryDissatisfiedIcon sx={{ color: '#ef4444' }} />
                                        </Box>
                                        <Box sx={{ textAlign: 'left' }}>
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                                                Flaky Risk Hub
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                                                Risk: last {stability?.executionHistory?.length || 0} cycles
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            size="small"
                                            variant="text"
                                            onClick={() => onViewAllScenarios?.('flaky')}
                                            sx={{ fontWeight: 800, textTransform: 'none', color: '#ef4444', fontSize: '0.75rem' }}
                                            endIcon={<LaunchIcon sx={{ fontSize: 14 }} />}
                                        >
                                            Deep Dive
                                        </Button>
                                    </Box>
                                </Box>

                                <Grid container spacing={3} alignItems="center">
                                    <Grid size={{ xs: 12, sm: 3 }}>
                                        <Box sx={{ textAlign: 'center', p: 1, borderRight: { sm: '1px solid #e2e8f0' } }}>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                                                Flaky Tests
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5, my: 0.5 }}>
                                                <Typography variant="h3" sx={{ fontWeight: 900, color: '#1e293b' }}>
                                                    {stability?.totalFlakyScenarios || 0}
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#94a3b8' }}>tests</Typography>
                                            </Box>
                                            <Chip
                                                label={stability?.totalFlakyScenarios > 10 ? "Critical" : stability?.totalFlakyScenarios > 5 ? "Warning" : "Healthy"}
                                                size="small"
                                                sx={{
                                                    fontWeight: 800, height: 20, fontSize: '0.65rem',
                                                    bgcolor: stability?.totalFlakyScenarios > 10 ? '#fee2e2' : stability?.totalFlakyScenarios > 5 ? '#fef9c3' : '#dcfce7',
                                                    color: stability?.totalFlakyScenarios > 10 ? '#991b1b' : stability?.totalFlakyScenarios > 5 ? '#854d0e' : '#166534',
                                                    borderRadius: 1.5, mb: 1
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: '0.7rem' }}>
                                                {stability?.totalFlakyScenarios > 10 ? "High Risk" : stability?.totalFlakyScenarios > 5 ? "Moderate Risk" : "Low Risk"}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 9 }}>
                                        <Box sx={{ width: '100%', height: 140, position: 'relative' }}>
                                            <Box sx={{ pt: 2, width: '100%', height: '100%' }}>
                                                {stability?.flakyScenarios && stability.flakyScenarios.length > 0 ? (
                                                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                                        {hoveredFlakyIndex !== null && (
                                                            <Paper sx={{
                                                                position: 'absolute',
                                                                left: `${(hoveredFlakyIndex / (Math.min(15, stability.flakyScenarios.length) - 1)) * 100}%`,
                                                                top: (100 - Math.min(stability.flakyScenarios[hoveredFlakyIndex].stabilityScore, 100)) + '%',
                                                                transform: 'translate(-50%, -120%)',
                                                                bgcolor: '#1e293b', color: 'white', px: 1, py: 0.5, borderRadius: 1.5,
                                                                zIndex: 10, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                                                                pointerEvents: 'none', textAlign: 'center', maxWidth: 200
                                                            }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.6rem', color: '#fca5a5', display: 'block' }} noWrap>
                                                                    {stability.flakyScenarios[hoveredFlakyIndex].scenarioName}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'white', display: 'block' }}>
                                                                    {Math.min(stability.flakyScenarios[hoveredFlakyIndex].stabilityScore, 100)}%
                                                                </Typography>
                                                            </Paper>
                                                        )}

                                                        <svg width="100%" height="100%" viewBox="-20 0 420 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                                            <defs>
                                                                <linearGradient id="flakyGradient" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                                                                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                                                                </linearGradient>
                                                            </defs>
                                                            {/* Y-axis labels */}
                                                            {[0, 20, 40, 60, 80, 100].map((tick) => (
                                                                <g key={tick}>
                                                                    <line x1="-5" y1={100 - tick} x2="0" y2={100 - tick} stroke="#fecaca" strokeWidth="1" />
                                                                    <text x="-10" y={100 - tick} fontSize="8" fill="#f87171" textAnchor="end" dominantBaseline="middle">{tick}%</text>
                                                                </g>
                                                            ))}
                                                            <path
                                                                d={`M 0,${100 - Math.min((stability.flakyScenarios[0]?.stabilityScore || 100), 100)} ${stability.flakyScenarios.slice(0, Math.min(15, stability.flakyScenarios.length)).map((s: any, i: number) =>
                                                                    `L ${(i / (Math.min(15, stability.flakyScenarios.length) - 1)) * 400},${100 - Math.min(s.stabilityScore, 100)}`
                                                                ).join(' ')} L 400,100 L 0,100 Z`}
                                                                fill="url(#flakyGradient)"
                                                            />
                                                            <path
                                                                d={`M 0,${100 - Math.min((stability.flakyScenarios[0]?.stabilityScore || 100), 100)} ${stability.flakyScenarios.slice(0, Math.min(15, stability.flakyScenarios.length)).map((s: any, i: number) =>
                                                                    `L ${(i / (Math.min(15, stability.flakyScenarios.length) - 1)) * 400},${100 - Math.min(s.stabilityScore, 100)}`
                                                                ).join(' ')}`}
                                                                fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                                            />
                                                            {stability.flakyScenarios.slice(0, Math.min(15, stability.flakyScenarios.length)).map((s: any, i: number) => (
                                                                <g key={i}>
                                                                    {hoveredFlakyIndex === i && (
                                                                        <line x1={(i / (Math.min(15, stability.flakyScenarios.length) - 1)) * 400} y1="0" x2={(i / (Math.min(15, stability.flakyScenarios.length) - 1)) * 400} y2="100" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
                                                                    )}
                                                                    <circle
                                                                        cx={(i / (Math.min(15, stability.flakyScenarios.length) - 1)) * 400}
                                                                        cy={100 - Math.min(s.stabilityScore, 100)}
                                                                        r={hoveredFlakyIndex === i ? "5" : "3"}
                                                                        fill="white" stroke="#ef4444" strokeWidth={hoveredFlakyIndex === i ? "3" : "2"}
                                                                    />
                                                                    <rect
                                                                        x={((i / (Math.min(15, stability.flakyScenarios.length) - 1)) * 400) - 15}
                                                                        y="0" width="30" height="100" fill="transparent"
                                                                        onMouseEnter={() => setHoveredFlakyIndex(i)} onMouseLeave={() => setHoveredFlakyIndex(null)}
                                                                        style={{ cursor: 'pointer' }}
                                                                    />
                                                                </g>
                                                            ))}
                                                        </svg>
                                                    </Box>
                                                ) : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.75rem' }}>No flaky data</Box>}
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 'auto', pt: 3, borderTop: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic', display: 'block', textAlign: 'center', lineHeight: 1.6 }}>
                                        💡 Eliminating flaky tests accelerates development velocity and builds developer trust
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Paper sx={{ p: 3, borderRadius: 5, bgcolor: '#f5f3ff', border: '1px solid #ede9fe', height: '100%', minHeight: 280, display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#7c3aed' }}>
                                    <SentimentVeryDissatisfiedIcon sx={{ fontSize: 20 }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>How Flakiness is tracked</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#6d28d9', display: 'block', mb: 0.5 }}>TECHNICAL DEBT</Typography>
                                        <Typography variant="body2" sx={{ color: '#5b21b6', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5 }}>
                                            Intermittent failures (pass then fail) represent technical debt that blocks pipeline velocity.
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#6d28d9', display: 'block', mb: 0.5 }}>RISK SCORE</Typography>
                                        <Typography variant="body2" sx={{ color: '#5b21b6', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5 }}>
                                            The risk % is derived from the fail count across your recent 10-run execution window.
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#6d28d9', display: 'block', mb: 0.5 }}>STABILIZATION</Typography>
                                        <Typography variant="body2" sx={{ color: '#5b21b6', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5 }}>
                                            High-risk tests should be environment-stabilized to ensure zero false-negatives.
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};
