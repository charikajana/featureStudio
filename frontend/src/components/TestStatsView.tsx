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
    const [trends, setTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
    const [hoveredFlakyIndex, setHoveredFlakyIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [statsRes, stabilityRes, trendsRes] = await Promise.all([
                    featureService.getTestStats(repoUrl, branch),
                    featureService.getStabilityStats(repoUrl, branch),
                    featureService.getTrends(repoUrl, branch || 'main')
                ]);
                setStats(statsRes.data);
                setStability(stabilityRes.data);
                setTrends(trendsRes.data);
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
                <CircularProgress thickness={5} size={60} sx={{ color: '#3b82f6' }} />
            </Box>
        );
    }

    if (!stats) return null;

    const getBuildUrl = (runId: number) => {
        if (!repoUrl) return "#";
        const baseUrl = repoUrl.split('/_git/')[0];
        return `${baseUrl}/_build/results?buildId=${runId}`;
    };

    // Helper function to calculate Y position on 100-height scale
    const getY = (count: number, paddedMin: number, displayRange: number) => 90 - ((count - paddedMin) / displayRange * 80);

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
                    <AccountTreeIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
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
                <Grid size={{ xs: 12 }}>
                    {/* RELIABILITY HUB */}
                    <Grid container spacing={3} sx={{ mb: 3, alignItems: 'stretch' }}>
                        <Grid size={{ xs: 12, md: 9 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Paper elevation={0} sx={{
                                p: 3, borderRadius: 5, border: '1px solid #e2e8f0', bgcolor: 'white',
                                position: 'relative', overflow: 'hidden',
                                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                                display: 'flex', flexDirection: 'column', minHeight: 320,
                                boxShadow: '0 10px 20px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02)'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ flex: 1 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{
                                            width: 40, height: 40, bgcolor: alpha('#3b82f6', 0.08),
                                            borderRadius: '12px', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', border: '1px solid rgba(59, 130, 246, 0.1)'
                                        }}>
                                            <HistoryIcon sx={{ color: '#3b82f6', fontSize: 22 }} />
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
                                            size="small" variant="text"
                                            onClick={() => onViewAllScenarios?.('all')}
                                            sx={{ fontWeight: 800, textTransform: 'none', color: '#3b82f6', fontSize: '0.75rem' }}
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
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 9 }}>
                                        <Box sx={{ width: '100%', height: 140, position: 'relative' }}>
                                            {stability?.executionHistory && (stability.executionHistory as any[]).length > 0 ? (
                                                <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                                    {hoveredIndex !== null && (
                                                        <Paper elevation={0} sx={{
                                                            position: 'absolute',
                                                            left: `${(hoveredIndex / ((stability.executionHistory as any[]).length - 1)) * 100}%`,
                                                            top: (100 - ((stability.executionHistory as any[])[hoveredIndex].passRate)) + '%',
                                                            transform: 'translate(-50%, -120%)',
                                                            bgcolor: 'rgba(15, 23, 42, 0.9)',
                                                            backdropFilter: 'blur(8px)',
                                                            color: 'white', p: 1.2, borderRadius: '12px', zIndex: 20,
                                                            boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            pointerEvents: 'none', minWidth: 100
                                                        }}>
                                                            <Typography sx={{ fontWeight: 900, fontSize: '0.6rem', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.2 }}>
                                                                Build #{(stability.executionHistory as any[])[hoveredIndex].runId}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 950, color: 'white', fontSize: '0.9rem' }}>
                                                                {(stability.executionHistory as any[])[hoveredIndex].passRate}% <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 500 }}>Pass Rate</span>
                                                            </Typography>
                                                        </Paper>
                                                    )}

                                                    <svg width="100%" height="100%" viewBox="-20 0 420 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                                        <defs>
                                                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                                            </linearGradient>
                                                            <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                                                                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                                                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                                            </filter>
                                                        </defs>
                                                        {[0, 25, 50, 75, 100].map((tick) => (
                                                            <g key={tick}>
                                                                <line x1="-5" y1={100 - tick} x2="400" y2={100 - tick} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                                                                <text x="-12" y={100 - tick} fontSize="8" fill="#94a3b8" textAnchor="end" dominantBaseline="middle" style={{ fontWeight: 700 }}>{tick}%</text>
                                                            </g>
                                                        ))}
                                                        <path
                                                            d={`M 0, 100 L 0, ${100 - ((stability.executionHistory as any[])[0].passRate)} ${(stability.executionHistory as any[]).map((v: any, i: number) => `L ${(i / ((stability.executionHistory as any[]).length - 1)) * 400},${100 - v.passRate}`).join(' ')} L 400, 100 Z`}
                                                            fill="url(#areaGradient)" style={{ transition: 'all 0.5s ease', pointerEvents: 'none' }}
                                                        />
                                                        <path
                                                            d={`M 0, ${100 - ((stability.executionHistory as any[])[0].passRate)} ${(stability.executionHistory as any[]).map((v: any, i: number) => `L ${(i / ((stability.executionHistory as any[]).length - 1)) * 400},${100 - v.passRate}`).join(' ')}`}
                                                            fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#neonBlur)" style={{ transition: 'all 0.5s ease', pointerEvents: 'none' }}
                                                        />
                                                        {(stability.executionHistory as any[]).map((v: any, i: number) => (
                                                            <g key={i}>
                                                                {hoveredIndex === i && <line x1={(i / ((stability.executionHistory as any[]).length - 1)) * 400} y1="0" x2={(i / ((stability.executionHistory as any[]).length - 1)) * 400} y2="100" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4" strokeOpacity="0.5" />}
                                                                <circle
                                                                    cx={(i / ((stability.executionHistory as any[]).length - 1)) * 400}
                                                                    cy={100 - v.passRate} r={hoveredIndex === i ? 6 : 3.5}
                                                                    fill="white" stroke="#3b82f6" strokeWidth={hoveredIndex === i ? 3 : 2}
                                                                    style={{ transition: 'all 0.2s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
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
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Paper sx={{ p: 3, borderRadius: 5, bgcolor: '#eff6ff', border: '1px solid #dbeafe', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 20px rgba(0,0,0,0.04)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#2563eb' }}>
                                    <HistoryIcon sx={{ fontSize: 20 }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>How Stability works</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Typography variant="body2" sx={{ color: '#1e40af', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5 }}>
                                        The system analyzes the latest 10 executions for every single test scenario in your project. Aggregated stability is the average across all tracked scenarios.
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* FLAKY RISK HUB */}
                    <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                        <Grid size={{ xs: 12, md: 9 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Paper elevation={0} sx={{
                                p: 3, borderRadius: 5, border: '1px solid #e2e8f0', bgcolor: 'white',
                                position: 'relative', overflow: 'hidden',
                                background: 'linear-gradient(180deg, #ffffff 0%, #fffbfb 100%)',
                                display: 'flex', flexDirection: 'column', minHeight: 320,
                                boxShadow: '0 10px 20px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02)'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ flex: 1 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{
                                            width: 40, height: 40, bgcolor: alpha('#ef4444', 0.08),
                                            borderRadius: '12px', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.1)'
                                        }}>
                                            <SentimentVeryDissatisfiedIcon sx={{ color: '#ef4444', fontSize: 22 }} />
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
                                            size="small" variant="text"
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
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 9 }}>
                                        <Box sx={{ width: '100%', height: 140, position: 'relative' }}>
                                            {stability?.flakyScenarios && (stability.flakyScenarios as any[]).length > 0 ? (
                                                <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                                    {hoveredFlakyIndex !== null && (
                                                        <Paper elevation={0} sx={{
                                                            position: 'absolute',
                                                            left: `${(hoveredFlakyIndex / (Math.min(15, (stability.flakyScenarios as any[]).length) - 1)) * 100}%`,
                                                            top: (100 - Math.min((stability.flakyScenarios as any[])[hoveredFlakyIndex].stabilityScore, 100)) + '%',
                                                            transform: 'translate(-50%, -120%)',
                                                            bgcolor: 'rgba(15, 23, 42, 0.9)',
                                                            backdropFilter: 'blur(8px)',
                                                            color: 'white', p: 1.2, borderRadius: '12px', zIndex: 20,
                                                            boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            pointerEvents: 'none', maxWidth: 220
                                                        }}>
                                                            <Typography sx={{ fontWeight: 900, fontSize: '0.6rem', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.2 }} noWrap>
                                                                {(stability.flakyScenarios as any[])[hoveredFlakyIndex].scenarioName}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 950, color: 'white', fontSize: '0.9rem' }}>
                                                                {Math.min((stability.flakyScenarios as any[])[hoveredFlakyIndex].stabilityScore, 100)}% <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 500 }}>Stability</span>
                                                            </Typography>
                                                        </Paper>
                                                    )}

                                                    <svg width="100%" height="100%" viewBox="-20 0 420 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                                        <defs>
                                                            <linearGradient id="flakyGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                                                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                                                            </linearGradient>
                                                            <filter id="flakyNeonBlur" x="-20%" y="-20%" width="140%" height="140%">
                                                                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                                                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                                            </filter>
                                                        </defs>
                                                        {[0, 25, 50, 75, 100].map((tick) => (
                                                            <g key={tick}>
                                                                <line x1="-5" y1={100 - tick} x2="400" y2={100 - tick} stroke="#fee2e2" strokeWidth="1" strokeDasharray="4" strokeOpacity="0.5" />
                                                                <text x="-12" y={100 - tick} fontSize="8" fill="#f87171" textAnchor="end" dominantBaseline="middle" style={{ fontWeight: 700 }}>{tick}%</text>
                                                            </g>
                                                        ))}
                                                        <path
                                                            d={`M 0, 100 L 0, ${100 - Math.min(((stability.flakyScenarios as any[])[0]?.stabilityScore || 100), 100)} ${(stability.flakyScenarios as any[]).slice(0, Math.min(15, (stability.flakyScenarios as any[]).length)).map((s: any, i: number) => `L ${(i / (Math.min(15, (stability.flakyScenarios as any[]).length) - 1)) * 400},${100 - Math.min(s.stabilityScore, 100)}`).join(' ')} L 400, 100 Z`}
                                                            fill="url(#flakyGradient)" style={{ transition: 'all 0.5s ease', pointerEvents: 'none' }}
                                                        />
                                                        <path
                                                            d={`M 0, ${100 - Math.min(((stability.flakyScenarios as any[])[0]?.stabilityScore || 100), 100)} ${(stability.flakyScenarios as any[]).slice(0, Math.min(15, (stability.flakyScenarios as any[]).length)).map((s: any, i: number) => `L ${(i / (Math.min(15, (stability.flakyScenarios as any[]).length) - 1)) * 400},${100 - Math.min(s.stabilityScore, 100)}`).join(' ')}`}
                                                            fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#flakyNeonBlur)" style={{ transition: 'all 0.5s ease', pointerEvents: 'none' }}
                                                        />
                                                        {(stability.flakyScenarios as any[]).slice(0, Math.min(15, (stability.flakyScenarios as any[]).length)).map((s: any, i: number) => (
                                                            <g key={i}>
                                                                {hoveredFlakyIndex === i && <line x1={(i / (Math.min(15, (stability.flakyScenarios as any[]).length) - 1)) * 400} y1="0" x2={(i / (Math.min(15, (stability.flakyScenarios as any[]).length) - 1)) * 400} y2="100" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" strokeOpacity="0.5" />}
                                                                <circle
                                                                    cx={(i / (Math.min(15, (stability.flakyScenarios as any[]).length) - 1)) * 400}
                                                                    cy={100 - Math.min(s.stabilityScore, 100)} r={hoveredFlakyIndex === i ? 6 : 3.5}
                                                                    fill="white" stroke="#ef4444" strokeWidth={hoveredFlakyIndex === i ? 3 : 2}
                                                                    style={{ transition: 'all 0.2s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                                                                />
                                                                <rect
                                                                    x={((i / (Math.min(15, (stability.flakyScenarios as any[]).length) - 1)) * 400) - 15}
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
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <Paper sx={{ p: 3, borderRadius: 5, bgcolor: '#f5f3ff', border: '1px solid #ede9fe', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 20px rgba(0,0,0,0.04)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#6d28d9' }}>
                                    <SentimentVeryDissatisfiedIcon sx={{ fontSize: 20 }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Flakiness tracking</Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#5b21b6', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5 }}>
                                    Technical debt from intermittent failures (pass then fail) is tracked across a 10-run window. Zero false-negatives is our target.
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* TEST GROWTH HUB */}
                    <Grid container spacing={3} sx={{ mt: 3, alignItems: 'stretch' }}>
                        <Grid size={{ xs: 12 }}>
                            <Paper elevation={0} sx={{
                                p: 3, borderRadius: 5, border: '1px solid #e2e8f0', bgcolor: 'white',
                                position: 'relative', overflow: 'hidden',
                                background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
                                display: 'flex', flexDirection: 'column', minHeight: 320,
                                boxShadow: '0 10px 20px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02)'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, gap: 1.5 }}>
                                    <Box sx={{
                                        width: 40, height: 40, bgcolor: alpha('#10b981', 0.08),
                                        borderRadius: '12px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.1)'
                                    }}>
                                        <AccountTreeIcon sx={{ color: '#10b981', fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                                            Test Growth Hub
                                        </Typography>
                                    </Box>
                                </Box>

                                <Grid container spacing={3} alignItems="center">
                                    <Grid size={{ xs: 12, sm: 2 }}>
                                        <Box sx={{ textAlign: 'center', p: 1, borderRight: { sm: '1px solid #e2e8f0' } }}>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Pool</Typography>
                                            <Typography variant="h3" sx={{ fontWeight: 900, color: '#1e293b', my: 1 }}>
                                                {trends.length > 0 ? trends[trends.length - 1].testCount : 0}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 10 }}>
                                        <Box sx={{ width: '100%', height: 160, position: 'relative' }}>
                                            {trends.length > 0 ? (
                                                <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                                                    {hoveredTrendIndex !== null && (() => {
                                                        const maxCount = Math.max(...trends.map(t => t.testCount)) || 1;
                                                        const minCount = Math.min(...trends.map(t => t.testCount)) || 0;
                                                        const actualRange = maxCount - minCount;
                                                        const paddedMax = actualRange < 5 ? maxCount + 2 : maxCount + (actualRange * 0.2);
                                                        const paddedMin = Math.max(0, actualRange < 5 ? Math.max(0, minCount - 2) : minCount - (actualRange * 0.1));
                                                        const displayRange = paddedMax - paddedMin || 10;

                                                        return (
                                                            <Paper elevation={0} sx={{
                                                                position: 'absolute',
                                                                left: `${(hoveredTrendIndex / (trends.length - 1)) * 100}%`,
                                                                top: (getY(trends[hoveredTrendIndex].testCount, paddedMin, displayRange)) + '%',
                                                                transform: 'translate(-50%, -130%)',
                                                                bgcolor: 'rgba(6, 78, 59, 0.95)',
                                                                backdropFilter: 'blur(8px)',
                                                                color: 'white', p: 1.2, borderRadius: '12px', zIndex: 20,
                                                                boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                pointerEvents: 'none', textAlign: 'center', minWidth: 120
                                                            }}>
                                                                <Typography sx={{ fontWeight: 900, fontSize: '0.6rem', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 0.2 }}>
                                                                    {new Date(trends[hoveredTrendIndex].capturedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ fontWeight: 950, color: 'white', fontSize: '0.9rem' }}>
                                                                    {trends[hoveredTrendIndex].testCount} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>Tests</span>
                                                                </Typography>
                                                            </Paper>
                                                        );
                                                    })()}

                                                    <svg width="100%" height="100%" viewBox="-40 0 460 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                                        <defs>
                                                            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                                                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                                            </linearGradient>
                                                            <filter id="growthNeonBlur" x="-20%" y="-20%" width="140%" height="140%">
                                                                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                                                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                                            </filter>
                                                        </defs>
                                                        {(() => {
                                                            const maxCount = Math.max(...trends.map(t => t.testCount)) || 1;
                                                            const minCount = Math.min(...trends.map(t => t.testCount)) || 0;
                                                            const actualRange = maxCount - minCount;
                                                            const paddedMax = actualRange < 5 ? maxCount + 2 : maxCount + (actualRange * 0.2);
                                                            const paddedMin = Math.max(0, actualRange < 5 ? Math.max(0, minCount - 2) : minCount - (actualRange * 0.1));
                                                            const displayRange = paddedMax - paddedMin || 10;
                                                            const points = trends.map((t, i) => ({
                                                                x: (i / Math.max(1, trends.length - 1)) * 400,
                                                                y: getY(t.testCount, paddedMin, displayRange)
                                                            }));
                                                            const pathData = `M ${points[0].x},${points[0].y} ${points.map(p => `L ${p.x},${p.y}`).join(' ')}`;
                                                            const areaData = `M 0, 100 L ${points[0].x},${points[0].y} ${points.map(p => `L ${p.x},${p.y}`).join(' ')} L 400, 100 Z`;
                                                            const rawLabels = [Math.round(paddedMax), Math.round((paddedMax + paddedMin) / 2), Math.round(paddedMin)];
                                                            const yLabels = Array.from(new Set(rawLabels)).sort((a, b) => b - a).map(val => ({ val, y: getY(val, paddedMin, displayRange) }));

                                                            return (
                                                                <>
                                                                    {yLabels.map((lbl, idx) => (
                                                                        <g key={`lbl-${idx}`}>
                                                                            <line x1="0" y1={lbl.y} x2="400" y2={lbl.y} stroke="#d1fae5" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.5" />
                                                                            <text x="-12" y={lbl.y + 3} textAnchor="end" fill="#10b981" style={{ fontSize: '9px', fontWeight: 800 }}>{lbl.val}</text>
                                                                        </g>
                                                                    ))}
                                                                    <path d={areaData} fill="url(#growthGradient)" style={{ transition: 'all 0.5s ease' }} />
                                                                    <path d={pathData} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#growthNeonBlur)" style={{ transition: 'all 0.5s ease' }} />
                                                                    {points.map((p, i) => (
                                                                        <g key={i}>
                                                                            {hoveredTrendIndex === i && <line x1={p.x} y1="0" x2={p.x} y2="100" stroke="#10b981" strokeWidth="1" strokeDasharray="4" strokeOpacity="0.5" />}
                                                                            <circle cx={p.x} cy={p.y} r={hoveredTrendIndex === i ? 6 : 3.5} fill="white" stroke="#10b981" strokeWidth={hoveredTrendIndex === i ? 3 : 2} style={{ transition: 'all 0.2s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                                                            <rect x={p.x - 15} y="0" width="30" height="100" fill="transparent" onMouseEnter={() => setHoveredTrendIndex(i)} onMouseLeave={() => setHoveredTrendIndex(null)} />
                                                                        </g>
                                                                    ))}
                                                                </>
                                                            );
                                                        })()}
                                                    </svg>
                                                </Box>
                                            ) : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontStyle: 'italic' }}>Collecting growth data...</Box>}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};
