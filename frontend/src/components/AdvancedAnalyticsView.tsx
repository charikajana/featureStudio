import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    LinearProgress,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    InputAdornment,
    TablePagination,
    IconButton,
    Slide,
    Tooltip
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import BugReportIcon from '@mui/icons-material/BugReport';
import BoltIcon from '@mui/icons-material/Bolt';
import LaunchIcon from '@mui/icons-material/Launch';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import { featureService } from '../services/api';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface AdvancedAnalyticsViewProps {
    repoUrl: string;
    branch?: string;
    onBack?: () => void;
    onSync?: () => Promise<void>;
}

export const AdvancedAnalyticsView: React.FC<AdvancedAnalyticsViewProps> = ({
    repoUrl,
    branch,
    onBack,
    onSync
}) => {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [data, setData] = useState<any>(null);
    const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);

    // Pagination and Search state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [searchTerm, setSearchTerm] = useState('');

    // Performance states
    const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
    const [perfSearchTerm, setPerfSearchTerm] = useState('');
    const [perfPage, setPerfPage] = useState(0);

    // Feature Files Deep Dive
    const [isFeatureFilesOpen, setIsFeatureFilesOpen] = useState(false);
    const [featureFilesSearch, setFeatureFilesSearch] = useState('');
    const [featureFilesPage, setFeatureFilesPage] = useState(0);

    // Scenarios Deep Dive
    const [isScenariosOpen, setIsScenariosOpen] = useState(false);
    const [scenariosSearch, setScenariosSearch] = useState('');
    const [scenariosPage, setScenariosPage] = useState(0);

    // Outlines Deep Dive
    const [isOutlinesOpen, setIsOutlinesOpen] = useState(false);
    const [outlinesSearch, setOutlinesSearch] = useState('');
    const [outlinesPage, setOutlinesPage] = useState(0);

    // Stability Drift Deep Dive
    const [isDriftDetailsOpen, setIsDriftDetailsOpen] = useState(false);
    const [hoveredRunIndex, setHoveredRunIndex] = useState<number | null>(null);
    const [showVolume, setShowVolume] = useState(true);
    const [showPassRate, setShowPassRate] = useState(true);

    const [thresholdDialog, setThresholdDialog] = useState<any>(null); // { scenarioName, featureFile, expectedDurationMillis }
    const [savingThreshold, setSavingThreshold] = useState(false);

    const refreshAnalytics = () => {
        setLoading(true);
        featureService.getAnalytics(repoUrl, branch)
            .then(res => {
                setData(res.data);
                setLastRefresh(new Date());
            })
            .catch(err => console.error("Failed to load analytics", err))
            .finally(() => setLoading(false));
    };

    const handleSync = async () => {
        if (!onSync) return;
        setSyncing(true);
        try {
            await onSync();
            // After global sync (which includes telemetry pull), refresh this view's data
            await refreshAnalytics();
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        refreshAnalytics();
    }, [repoUrl, branch]);

    const handleSaveThreshold = async () => {
        if (!thresholdDialog) return;
        setSavingThreshold(true);
        try {
            await featureService.updateScenarioConfig(repoUrl, {
                featureFile: thresholdDialog.featureFile,
                scenarioName: thresholdDialog.scenarioName,
                expectedDurationMillis: thresholdDialog.expectedDurationMillis
            });
            setThresholdDialog(null);
            refreshAnalytics();
        } catch (err) {
            console.error("Failed to save threshold", err);
        } finally {
            setSavingThreshold(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress thickness={5} size={60} sx={{ color: '#6366f1' }} />
            </Box>
        );
    }

    if (!data) return null;

    const StatItem = ({ icon: Icon, label, value, color }: any) => (
        <Box sx={{
            textAlign: 'left', flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover .stat-icon-container': { transform: 'scale(1.1)', bgcolor: `${color}20` }
        }}>
            <Box className="stat-icon-container" sx={{
                width: 44, height: 44, borderRadius: '12px',
                bgcolor: `${color}10`, color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s'
            }}>
                <Icon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 950, color: '#1e293b', lineHeight: 1 }}>{value}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>{label}</Typography>
            </Box>
        </Box>
    );

    return (
        <>
            <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden', maxWidth: 1600, mx: 'auto' }}>
                {/* Header section with Stability Drift */}
                <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {onBack && (
                            <Tooltip title="Go Back">
                                <IconButton
                                    size="small"
                                    onClick={onBack}
                                    sx={{
                                        bgcolor: '#f1f5f9',
                                        color: '#0f172a',
                                        '&:hover': { bgcolor: '#e2e8f0', transform: 'translateX(-2px)' },
                                        transition: 'all 0.2s',
                                        width: 32, height: 32
                                    }}
                                >
                                    <ArrowBackIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1.1 }}>
                                    Analytics Hub
                                </Typography>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.8,
                                    bgcolor: 'rgba(99, 102, 241, 0.05)',
                                    px: 1.2,
                                    py: 0.4,
                                    borderRadius: '20px',
                                    border: '1px solid rgba(99, 102, 241, 0.1)'
                                }}>
                                    <Box sx={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        bgcolor: syncing ? '#6366f1' : '#22c55e',
                                        animation: syncing ? 'pulse 1.5s infinite' : 'none',
                                        '@keyframes pulse': {
                                            '0%': { opacity: 1, transform: 'scale(1)' },
                                            '50%': { opacity: 0.4, transform: 'scale(1.2)' },
                                            '100%': { opacity: 1, transform: 'scale(1)' }
                                        }
                                    }} />
                                    <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                        {syncing ? 'SYNCING...' : `AUTO-SYNCED: ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                    </Typography>
                                    <Tooltip title="Direct Sync Now">
                                        <IconButton
                                            size="small"
                                            disabled={syncing}
                                            onClick={handleSync}
                                            sx={{
                                                p: 0,
                                                ml: 0.5,
                                                color: '#6366f1',
                                                '&:hover': { bgcolor: 'transparent', transform: 'rotate(180deg)' },
                                                transition: 'transform 0.4s'
                                            }}
                                        >
                                            <AutorenewIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>
                                Predictive insights & execution metrics
                            </Typography>
                        </Box>
                    </Box>

                    <Paper
                        onClick={() => setIsDriftDetailsOpen(true)}
                        sx={{
                            py: 1,
                            px: 2,
                            borderRadius: '16px',
                            bgcolor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid',
                            borderColor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            cursor: 'pointer',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                                bgcolor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            },
                            transition: 'all 0.2s'
                        }}>
                        <Box sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '10px',
                            bgcolor: data.stabilityDrift >= 0 ? '#22c55e' : '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0
                        }}>
                            <TrendingUpIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 950, color: data.stabilityDrift >= 0 ? '#16a34a' : '#dc2626', fontSize: '1rem', lineHeight: 1 }}>
                                    {data.stabilityDrift > 0 ? '+' : ''}{data.stabilityDrift}%
                                </Typography>
                                <Chip
                                    size="small"
                                    label={data.driftStatus}
                                    sx={{
                                        height: 18,
                                        fontSize: '0.6rem',
                                        fontWeight: 900,
                                        bgcolor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: data.stabilityDrift >= 0 ? '#14532d' : '#7f1d1d',
                                        borderRadius: '4px'
                                    }}
                                />
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.55rem', display: 'block' }}>
                                Stability Drift
                            </Typography>
                        </Box>
                    </Paper>
                </Box>

                <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Grid container spacing={3} sx={{ flexGrow: 1.5, minHeight: 0 }}>
                        {/* 1. Fragility Index Card */}
                        <Grid size={{ xs: 12, md: 6 }} sx={{ height: '100%' }}>
                            <Paper sx={{ p: 3, borderRadius: '24px', height: '100%', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                                            <BugReportIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e293b' }}>Fragility Index</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Scenarios predicted most likely to fail</Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ color: '#94a3b8', borderBottom: '2px solid #f1f5f9', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Scenario</TableCell>
                                                <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '2px solid #f1f5f9', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Risk Score</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.topFragileScenarios.map((s: any, i: number) => (
                                                <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                                                    <TableCell sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>{s.scenarioName}</Typography>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>{s.featureFile}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 900, color: s.fragilityScore > 50 ? '#ef4444' : '#f59e0b' }}>
                                                                {s.fragilityScore}%
                                                            </Typography>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={s.fragilityScore}
                                                                sx={{ width: 80, height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: s.fragilityScore > 50 ? '#ef4444' : '#f59e0b' } }}
                                                            />
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>

                        {/* 5. Execution Hotspots Card */}
                        <Grid size={{ xs: 12, md: 6 }} sx={{ height: '100%' }}>
                            <Paper sx={{ p: 3, borderRadius: '24px', height: '100%', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                            <BoltIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e293b' }}>Execution Hotspots</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>By duration vs global avg</Typography>
                                        </Box>
                                    </Box>
                                    <Button size="small" onClick={() => setIsPerformanceOpen(true)} sx={{ fontWeight: 800, textTransform: 'none' }}>View All</Button>
                                </Box>

                                <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ color: '#94a3b8', borderBottom: '2px solid #f1f5f9', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Scenario</TableCell>
                                                <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '2px solid #f1f5f9', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Avg Time</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.executionHotspots.filter((s: any) => s.isHotspot).slice(0, 5).map((s: any, i: number) => (
                                                <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                                                    <TableCell sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>{s.scenarioName}</Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                            {s.recentHistory?.map((h: any, j: number) => (
                                                                <Box key={j} sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: h.status === 'Passed' ? '#22c55e' : '#ef4444' }} />
                                                            ))}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 900, color: '#ef4444' }}>{(s.averageDurationMillis / 1000).toFixed(1)}s</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* 3. Automation ROI and Counts (COMPACTED) */}
                    <Grid size={{ xs: 12 }} sx={{ flexShrink: 0 }}>
                        <Paper sx={{ p: 2, borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1.2, borderRadius: '10px', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><AutorenewIcon /></Box>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Automation Efficiency</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>Project-wide ROI and reuse</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800 }}>ROI SCORE</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 950, color: '#22c55e', lineHeight: 1 }}>{data.overallStepReuseROI}%</Typography>
                                    </Box>
                                    <Button size="small" variant="contained" onClick={() => setIsDeepDiveOpen(true)} sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none', bgcolor: '#3b82f6' }}>Deep Dive</Button>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, p: 2, borderRadius: '16px', bgcolor: '#f8fafc' }}>
                                <StatItem icon={DescriptionIcon} label="Features" value={data.totalFeatures} color="#6366f1" />
                                <StatItem icon={FormatListBulletedIcon} label="Scenarios" value={data.totalScenarios} color="#3b82f6" />
                                <StatItem icon={QuizIcon} label="Outlines" value={data.totalScenarioOutlines} color="#8b5cf6" />
                                <StatItem icon={LaunchIcon} label="Total Steps" value={data.totalSteps} color="#22c55e" />
                            </Box>
                        </Paper>
                    </Grid>
                </Box>
            </Box>

            {/* Step Deep Dive Full-Screen Dialog */}
            <Dialog
                fullScreen
                open={isDeepDiveOpen}
                onClose={() => setIsDeepDiveOpen(false)}
                slots={{ transition: Transition }}
                slotProps={{
                    paper: {
                        sx: { bgcolor: '#f8fafc' }
                    }
                }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Sticky Header */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0,
                            bgcolor: 'white'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title="Exit Library">
                                <IconButton
                                    onClick={() => setIsDeepDiveOpen(false)}
                                    sx={{
                                        bgcolor: '#f1f5f9',
                                        color: '#0f172a',
                                        '&:hover': { bgcolor: '#e2e8f0', transform: 'translateX(-4px)' },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <ArrowBackIcon />
                                </IconButton>
                            </Tooltip>
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                <FormatListBulletedIcon />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
                                    Step Utilization Library
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                    Analyzing {data.allSteps?.length || 0} unique automation components
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <TextField
                                size="small"
                                placeholder="Search step text..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(0);
                                }}
                                sx={{
                                    width: 300,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '12px',
                                        bgcolor: '#f1f5f9',
                                        '& fieldset': { borderColor: 'transparent' },
                                        '&:hover fieldset': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#94a3b8' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <IconButton
                                onClick={() => setIsDeepDiveOpen(false)}
                                sx={{
                                    bgcolor: '#f1f5f9',
                                    '&:hover': { bgcolor: '#e2e8f0' },
                                    borderRadius: '12px'
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Paper>

                    {/* Table Content */}
                    <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
                        <TableContainer component={Paper} sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 1.5 }}># Rank</TableCell>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 1.5 }}>Step Gherkin Sentence</TableCell>
                                        <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 1.5 }}>Usage Count</TableCell>
                                        <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 1.5 }}>ROI (Efficiency %)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.allSteps
                                        ?.filter((s: any) => s.stepText.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((step: any, index: number) => {
                                            const globalIndex = page * rowsPerPage + index;
                                            return (
                                                <TableRow key={globalIndex} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                    <TableCell sx={{ py: 1 }}>
                                                        <Box sx={{
                                                            width: 24, height: 24, borderRadius: '6px',
                                                            bgcolor: globalIndex < 3 ? 'rgba(99, 102, 241, 0.1)' : '#f1f5f9',
                                                            color: globalIndex < 3 ? '#6366f1' : '#64748b',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 900, fontSize: '0.65rem'
                                                        }}>
                                                            {globalIndex + 1}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1 }}>
                                                        <Typography variant="body2" sx={{
                                                            fontFamily: 'JetBrains Mono, monospace',
                                                            color: '#0f172a',
                                                            fontWeight: 700,
                                                            fontSize: '0.925rem',
                                                            bgcolor: '#f1f5f9',
                                                            px: 1.5,
                                                            py: 0.5,
                                                            borderRadius: '6px',
                                                            display: 'inline-block',
                                                            border: '1px solid #e2e8f0'
                                                        }}>
                                                            {step.stepText}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ py: 1 }}>
                                                        <Chip
                                                            label={`${step.usageCount} Scenarios`}
                                                            size="small"
                                                            sx={{ fontWeight: 800, bgcolor: '#eff6ff', color: '#3b82f6', borderRadius: '4px', height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ py: 1 }}>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 950, color: '#16a34a', fontSize: '0.75rem' }}>
                                                                {(step.roiScore * 10).toFixed(1)}%
                                                            </Typography>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={step.roiScore * 10}
                                                                sx={{
                                                                    width: 80,
                                                                    height: 3,
                                                                    borderRadius: 1,
                                                                    mt: 0.25,
                                                                    bgcolor: '#f1f5f9',
                                                                    '& .MuiLinearProgress-bar': { bgcolor: '#22c55e' }
                                                                }}
                                                            />
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Pagination Footer */}
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <TablePagination
                                component="div"
                                count={data.allSteps?.filter((s: any) => s.stepText.toLowerCase().includes(searchTerm.toLowerCase())).length || 0}
                                page={page}
                                onPageChange={(_, newPage) => setPage(newPage)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                sx={{
                                    border: 'none',
                                    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                        fontWeight: 700,
                                        color: '#64748b'
                                    }
                                }}
                            />
                        </Box>
                    </Box>
                </Box>
            </Dialog>

            {/* Performance Metrics Full-Screen Dialog */}
            <Dialog
                fullScreen
                open={isPerformanceOpen}
                onClose={() => setIsPerformanceOpen(false)}
                slots={{ transition: Transition }}
                slotProps={{ paper: { sx: { bgcolor: '#f8fafc' } } }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Paper elevation={0} sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, bgcolor: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title="Exit Performance View">
                                <IconButton onClick={() => setIsPerformanceOpen(false)} sx={{ bgcolor: '#f1f5f9', color: '#0f172a', '&:hover': { bgcolor: '#e2e8f0', transform: 'translateX(-4px)' } }}>
                                    <ArrowBackIcon />
                                </IconButton>
                            </Tooltip>
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                <BoltIcon />
                            </Box>
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Performance Analysis</Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.8,
                                        bgcolor: 'rgba(99, 102, 241, 0.05)',
                                        px: 1.2,
                                        py: 0.4,
                                        borderRadius: '20px',
                                        border: '1px solid rgba(99, 102, 241, 0.1)'
                                    }}>
                                        <Box sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            bgcolor: syncing ? '#6366f1' : '#22c55e',
                                            animation: syncing ? 'pulse 1.5s infinite' : 'none',
                                            '@keyframes pulse': {
                                                '0%': { opacity: 1, transform: 'scale(1)' },
                                                '50%': { opacity: 0.4, transform: 'scale(1.2)' },
                                                '100%': { opacity: 1, transform: 'scale(1)' }
                                            }
                                        }} />
                                        <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                            {syncing ? 'SYNCING...' : `AUTO-SYNCED: ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                        </Typography>
                                        <Tooltip title="Direct Sync Now">
                                            <IconButton
                                                size="small"
                                                disabled={syncing}
                                                onClick={handleSync}
                                                sx={{
                                                    p: 0,
                                                    ml: 0.5,
                                                    color: '#6366f1',
                                                    '&:hover': { bgcolor: 'transparent', transform: 'rotate(180deg)' },
                                                    transition: 'transform 0.4s'
                                                }}
                                            >
                                                <AutorenewIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Global Avg: {(data.globalAverageDurationMillis / 1000).toFixed(1)}s | {data.executionHotspots?.length || 0} Scenarios total</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <TextField
                                size="small"
                                placeholder="Search scenarios..."
                                value={perfSearchTerm}
                                onChange={(e) => { setPerfSearchTerm(e.target.value); setPerfPage(0); }}
                                sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f1f5f9', '& fieldset': { borderColor: 'transparent' } } }}
                                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>) }}
                            />
                            <IconButton onClick={() => setIsPerformanceOpen(false)} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, borderRadius: '12px' }}><CloseIcon /></IconButton>
                        </Box>
                    </Paper>

                    <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
                        <TableContainer component={Paper} sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Scenario</TableCell>
                                        <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Avg Time</TableCell>
                                        <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Expected</TableCell>
                                        <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Last 10 Runs</TableCell>
                                        <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</TableCell>
                                        <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.executionHotspots
                                        ?.filter((s: any) => s.scenarioName.toLowerCase().includes(perfSearchTerm.toLowerCase()) || s.featureFile.toLowerCase().includes(perfSearchTerm.toLowerCase()))
                                        .slice(perfPage * rowsPerPage, perfPage * rowsPerPage + rowsPerPage)
                                        .map((s: any, idx: number) => (
                                            <TableRow key={idx} hover>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{s.scenarioName}</Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748b' }}>{s.featureFile}</Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2" sx={{ fontWeight: 900 }}>{(s.averageDurationMillis / 1000).toFixed(1)}s</Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography variant="body2" sx={{ color: s.expectedDurationMillis ? '#10b981' : '#94a3b8', fontWeight: 700 }}>
                                                        {s.expectedDurationMillis ? `${(s.expectedDurationMillis / 1000).toFixed(1)}s` : '---'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                        {s.recentHistory?.map((h: any, j: number) => (
                                                            <Tooltip key={j} title={`${h.status} - ${(h.durationMillis / 1000).toFixed(2)}s`}>
                                                                <Box
                                                                    sx={{
                                                                        width: 10,
                                                                        height: 10,
                                                                        borderRadius: '2px',
                                                                        bgcolor: h.status === 'Passed' ? '#22c55e' : '#ef4444'
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        ))}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={s.isHotspot ? "Bottleneck" : "Optimal"}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 900,
                                                            bgcolor: s.isHotspot ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                                            color: s.isHotspot ? '#ef4444' : '#22c55e',
                                                            borderRadius: '6px',
                                                            fontSize: '0.65rem'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        onClick={() => setThresholdDialog(s)}
                                                        sx={{ fontWeight: 800, textTransform: 'none' }}
                                                    >
                                                        Set Duration
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={data.executionHotspots?.length || 0}
                            page={perfPage}
                            onPageChange={(_, p) => setPerfPage(p)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPerfPage(0); }}
                        />
                    </Box>
                </Box>
            </Dialog>

            {/* Feature Files List Full-Screen Dialog */}
            <Dialog
                fullScreen
                open={isFeatureFilesOpen}
                onClose={() => setIsFeatureFilesOpen(false)}
                slots={{ transition: Transition }}
                slotProps={{ paper: { sx: { bgcolor: '#f8fafc' } } }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Paper elevation={0} sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, bgcolor: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title="Back to Analytics">
                                <IconButton onClick={() => setIsFeatureFilesOpen(false)} sx={{ bgcolor: '#f1f5f9', color: '#0f172a', '&:hover': { bgcolor: '#e2e8f0', transform: 'translateX(-4px)' } }}>
                                    <ArrowBackIcon />
                                </IconButton>
                            </Tooltip>
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                <DescriptionIcon />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Project Feature Files</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Total: {data.featureFiles?.length || 0} files in current branch</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <TextField
                                size="small"
                                placeholder="Search feature files..."
                                value={featureFilesSearch}
                                onChange={(e) => { setFeatureFilesSearch(e.target.value); setFeatureFilesPage(0); }}
                                sx={{ width: 350, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f1f5f9', '& fieldset': { borderColor: 'transparent' } } }}
                                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>) }}
                            />
                            <IconButton onClick={() => setIsFeatureFilesOpen(false)} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, borderRadius: '12px' }}><CloseIcon /></IconButton>
                        </Box>
                    </Paper>

                    <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
                        <Grid container spacing={2}>
                            {data.featureFiles
                                ?.filter((f: string) => f.toLowerCase().includes(featureFilesSearch.toLowerCase()))
                                .slice(featureFilesPage * 24, featureFilesPage * 24 + 24)
                                .map((file: string, idx: number) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={idx}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: '16px',
                                                border: '1px solid #e2e8f0',
                                                bgcolor: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    borderColor: '#6366f1',
                                                    boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.1)',
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'rgba(99, 102, 241, 0.05)', color: '#6366f1' }}>
                                                <DescriptionIcon sx={{ fontSize: 20 }} />
                                            </Box>
                                            <Box sx={{ overflow: 'hidden' }}>
                                                <Tooltip title={file}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 700,
                                                            color: '#1e293b',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        {file.split('/').pop()}
                                                    </Typography>
                                                </Tooltip>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                                                    {file.includes('/') ? file.substring(0, file.lastIndexOf('/')) : 'root'}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))}
                        </Grid>

                        {(data.featureFiles?.filter((f: string) => f.toLowerCase().includes(featureFilesSearch.toLowerCase())).length || 0) > 24 && (
                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                <TablePagination
                                    component="div"
                                    count={data.featureFiles?.filter((f: string) => f.toLowerCase().includes(featureFilesSearch.toLowerCase())).length || 0}
                                    page={featureFilesPage}
                                    onPageChange={(_, p) => setFeatureFilesPage(p)}
                                    rowsPerPage={24}
                                    rowsPerPageOptions={[]}
                                    sx={{ border: 'none' }}
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
            </Dialog>

            {/* Scenarios List Full-Screen Dialog */}
            <Dialog
                fullScreen
                open={isScenariosOpen}
                onClose={() => setIsScenariosOpen(false)}
                slots={{ transition: Transition }}
                slotProps={{ paper: { sx: { bgcolor: '#f8fafc' } } }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Paper elevation={0} sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, bgcolor: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title="Back to Analytics">
                                <IconButton onClick={() => setIsScenariosOpen(false)} sx={{ bgcolor: '#f1f5f9', color: '#0f172a', '&:hover': { bgcolor: '#e2e8f0', transform: 'translateX(-4px)' } }}>
                                    <ArrowBackIcon />
                                </IconButton>
                            </Tooltip>
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                <FormatListBulletedIcon />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Project Scenarios</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Total: {data.scenarioDetails?.length || 0} unique test scenarios</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <TextField
                                size="small"
                                placeholder="Search scenarios..."
                                value={scenariosSearch}
                                onChange={(e) => { setScenariosSearch(e.target.value); setScenariosPage(0); }}
                                sx={{ width: 350, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f1f5f9', '& fieldset': { borderColor: 'transparent' } } }}
                                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>) }}
                            />
                            <IconButton onClick={() => setIsScenariosOpen(false)} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, borderRadius: '12px' }}><CloseIcon /></IconButton>
                        </Box>
                    </Paper>

                    <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
                        <Grid container spacing={2}>
                            {data.scenarioDetails
                                ?.filter((s: any) => s.name.toLowerCase().includes(scenariosSearch.toLowerCase()) || s.featureFile.toLowerCase().includes(scenariosSearch.toLowerCase()))
                                .slice(scenariosPage * 24, scenariosPage * 24 + 24)
                                .map((scenario: any, idx: number) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={idx}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: '16px',
                                                border: '1px solid #e2e8f0',
                                                bgcolor: 'white',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 1.5,
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    borderColor: '#3b82f6',
                                                    boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.1)',
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ p: 0.75, borderRadius: '6px', bgcolor: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6' }}>
                                                    <FormatListBulletedIcon sx={{ fontSize: 18 }} />
                                                </Box>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                                                    {scenario.name}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ mt: 'auto', p: 1, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <DescriptionIcon sx={{ fontSize: 12 }} /> {scenario.featureFile.split('/').pop()}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))}
                        </Grid>

                        {(data.scenarioDetails?.filter((s: any) => s.name.toLowerCase().includes(scenariosSearch.toLowerCase())).length || 0) > 24 && (
                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                <TablePagination
                                    component="div"
                                    count={data.scenarioDetails?.filter((s: any) => s.name.toLowerCase().includes(scenariosSearch.toLowerCase())).length || 0}
                                    page={scenariosPage}
                                    onPageChange={(_, p) => setScenariosPage(p)}
                                    rowsPerPage={24}
                                    rowsPerPageOptions={[]}
                                    sx={{ border: 'none' }}
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
            </Dialog>

            {/* Outlines List Full-Screen Dialog */}
            <Dialog
                fullScreen
                open={isOutlinesOpen}
                onClose={() => setIsOutlinesOpen(false)}
                slots={{ transition: Transition }}
                slotProps={{ paper: { sx: { bgcolor: '#f8fafc' } } }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Paper elevation={0} sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, bgcolor: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title="Back to Analytics">
                                <IconButton onClick={() => setIsOutlinesOpen(false)} sx={{ bgcolor: '#f1f5f9', color: '#0f172a', '&:hover': { bgcolor: '#e2e8f0', transform: 'translateX(-4px)' } }}>
                                    <ArrowBackIcon />
                                </IconButton>
                            </Tooltip>
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                                <QuizIcon />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Scenario Outlines</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Total: {data.outlineDetails?.length || 0} data-driven templates</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <TextField
                                size="small"
                                placeholder="Search outlines..."
                                value={outlinesSearch}
                                onChange={(e) => { setOutlinesSearch(e.target.value); setOutlinesPage(0); }}
                                sx={{ width: 350, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f1f5f9', '& fieldset': { borderColor: 'transparent' } } }}
                                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>) }}
                            />
                            <IconButton onClick={() => setIsOutlinesOpen(false)} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, borderRadius: '12px' }}><CloseIcon /></IconButton>
                        </Box>
                    </Paper>

                    <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
                        <Grid container spacing={2}>
                            {data.outlineDetails
                                ?.filter((s: any) => s.name.toLowerCase().includes(outlinesSearch.toLowerCase()) || s.featureFile.toLowerCase().includes(outlinesSearch.toLowerCase()))
                                .slice(outlinesPage * 24, outlinesPage * 24 + 24)
                                .map((outline: any, idx: number) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={idx}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 2,
                                                borderRadius: '16px',
                                                border: '1px solid #e2e8f0',
                                                bgcolor: 'white',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 1.5,
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    borderColor: '#8b5cf6',
                                                    boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.1)',
                                                    transform: 'translateY(-2px)'
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ p: 0.75, borderRadius: '6px', bgcolor: 'rgba(139, 92, 246, 0.05)', color: '#8b5cf6' }}>
                                                    <QuizIcon sx={{ fontSize: 18 }} />
                                                </Box>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                                                    {outline.name}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ mt: 'auto', p: 1, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <DescriptionIcon sx={{ fontSize: 12 }} /> {outline.featureFile.split('/').pop()}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))}
                        </Grid>

                        {(data.outlineDetails?.filter((s: any) => s.name.toLowerCase().includes(outlinesSearch.toLowerCase())).length || 0) > 24 && (
                            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                                <TablePagination
                                    component="div"
                                    count={data.outlineDetails?.filter((s: any) => s.name.toLowerCase().includes(outlinesSearch.toLowerCase())).length || 0}
                                    page={outlinesPage}
                                    onPageChange={(_, p) => setOutlinesPage(p)}
                                    rowsPerPage={24}
                                    rowsPerPageOptions={[]}
                                    sx={{ border: 'none' }}
                                />
                            </Box>
                        )}
                    </Box>
                </Box>
            </Dialog>

            {/* Stability Drift Details Full-Screen Dialog */}
            <Dialog
                fullScreen
                open={isDriftDetailsOpen}
                onClose={() => setIsDriftDetailsOpen(false)}
                slots={{ transition: Transition }}
                slotProps={{ paper: { sx: { bgcolor: '#f8fafc' } } }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Paper elevation={0} sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, bgcolor: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title="Back to Analytics">
                                <IconButton onClick={() => setIsDriftDetailsOpen(false)} sx={{ bgcolor: '#f1f5f9', color: '#0f172a', '&:hover': { bgcolor: '#e2e8f0', transform: 'translateX(-4px)' } }}>
                                    <ArrowBackIcon />
                                </IconButton>
                            </Tooltip>
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: data.stabilityDrift >= 0 ? '#22c55e' : '#ef4444' }}>
                                <TrendingUpIcon />
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Stability Drift Analysis</Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Deep dive into regression velocity and execution health</Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={() => setIsDriftDetailsOpen(false)} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, borderRadius: '12px' }}><CloseIcon /></IconButton>
                    </Paper>

                    <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden', bgcolor: '#f8fafc' }}>

                        <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0 }}>
                            {/* Bar Chart Section - Expanded */}
                            <Grid size={{ xs: 12, lg: 9 }} sx={{ height: '100%' }}>
                                <Paper sx={{
                                    p: 3,
                                    height: '100%',
                                    borderRadius: '32px',
                                    border: '1px solid #e2e8f0',
                                    bgcolor: 'white',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0,
                                        height: '4px',
                                        bgcolor: '#6366f1',
                                        opacity: 0.1
                                    }
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 950, color: '#0f172a', letterSpacing: '-0.5px' }}>Execution Volume & Pass Rate</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Trend analysis across latest {data.recentRuns?.length || 0} builds</Typography>
                                        </Box>
                                        <Box sx={{
                                            display: 'flex',
                                            gap: 0.5,
                                            bgcolor: '#f1f5f9',
                                            p: 0.5,
                                            borderRadius: '14px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <Button
                                                size="small"
                                                onClick={() => setShowVolume(!showVolume)}
                                                sx={{
                                                    borderRadius: '10px',
                                                    px: 2,
                                                    py: 0.5,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 900,
                                                    textTransform: 'none',
                                                    bgcolor: showVolume ? 'white' : 'transparent',
                                                    color: showVolume ? '#0f172a' : '#64748b',
                                                    boxShadow: showVolume ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                                    '&:hover': { bgcolor: showVolume ? 'white' : 'rgba(0,0,0,0.04)' }
                                                }}
                                            >
                                                Volume
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => setShowPassRate(!showPassRate)}
                                                sx={{
                                                    borderRadius: '10px',
                                                    px: 2,
                                                    py: 0.5,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 900,
                                                    textTransform: 'none',
                                                    bgcolor: showPassRate ? 'white' : 'transparent',
                                                    color: showPassRate ? '#6366f1' : '#64748b',
                                                    boxShadow: showPassRate ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                                                    '&:hover': { bgcolor: showPassRate ? 'white' : 'rgba(0,0,0,0.04)' }
                                                }}
                                            >
                                                Pass Rate %
                                            </Button>
                                        </Box>
                                    </Box>

                                    <Box sx={{ flexGrow: 1, width: '100%', position: 'relative', mt: 2, minHeight: 0 }}>
                                        {data.recentRuns && data.recentRuns.length > 0 ? (
                                            <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                                <defs>
                                                    <linearGradient id="passedPill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#10b981" />
                                                        <stop offset="100%" stopColor="#059669" />
                                                    </linearGradient>
                                                    <linearGradient id="failedPill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#f43f5e" />
                                                        <stop offset="100%" stopColor="#e11d48" />
                                                    </linearGradient>
                                                    <linearGradient id="skippedPill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#94a3b8" />
                                                        <stop offset="100%" stopColor="#64748b" />
                                                    </linearGradient>
                                                </defs>

                                                {/* Axis Labels and Grid */}
                                                {(() => {
                                                    const maxTests = Math.max(...data.recentRuns.map((r: any) => r.passedCount + r.failedCount + r.skippedCount)) || 10;
                                                    let ticks = [0, Math.round(maxTests * 0.25), Math.round(maxTests * 0.5), Math.round(maxTests * 0.75), maxTests];

                                                    return (
                                                        <g>
                                                            <text x="15" y="200" textAnchor="middle" transform="rotate(-90 15,200)" fill="#64748b" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Tests</text>
                                                            {ticks.map((tickValue) => {
                                                                const y = 350 - (tickValue / maxTests) * 300;
                                                                return (
                                                                    <g key={`l-tick-${tickValue}`}>
                                                                        <line x1="45" y1={y} x2="755" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray={tickValue === 0 ? "0" : "5,5"} />
                                                                        <text x="38" y={y} textAnchor="end" dominantBaseline="middle" fill="#94a3b8" style={{ fontSize: '11px', fontWeight: 900 }}>{tickValue}</text>
                                                                    </g>
                                                                );
                                                            })}
                                                            {showPassRate && (
                                                                <g>
                                                                    <text x="785" y="200" textAnchor="middle" transform="rotate(90 785,200)" fill="#6366f1" style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Stability %</text>
                                                                    {[0, 25, 50, 75, 100].map(v => (
                                                                        <text key={`r-tick-${v}`} x="765" y={350 - (v / 100) * 300} textAnchor="start" dominantBaseline="middle" fill="#818cf8" style={{ fontSize: '10px', fontWeight: 900 }}>{v}%</text>
                                                                    ))}
                                                                </g>
                                                            )}
                                                        </g>
                                                    );
                                                })()}

                                                {(() => {
                                                    const trendPoints: { x: number, y: number }[] = [];
                                                    const maxTotal = Math.max(...data.recentRuns.map((r: any) => r.passedCount + r.failedCount + r.skippedCount)) || 1;
                                                    const barGap = (680 / data.recentRuns.length);
                                                    const barWidth = Math.min(55, barGap * 0.75);

                                                    data.recentRuns.forEach((run: any, idx: number) => {
                                                        const x = 60 + (idx * barGap);
                                                        const total = run.passedCount + run.failedCount + run.skippedCount;
                                                        const passRatePercent = (run.passedCount / Math.max(1, total)) * 100;
                                                        // Pass rate trend y is separate scale (0-100%)
                                                        const yTrend = 350 - (passRatePercent / 100) * 300;
                                                        trendPoints.push({ x: x + barWidth / 2, y: yTrend });
                                                    });

                                                    return (
                                                        <>
                                                            {/* Volume Bars */}
                                                            {showVolume && data.recentRuns.map((run: any, idx: number) => {
                                                                const x = 60 + (idx * barGap);
                                                                const hPassed = (run.passedCount / maxTotal) * 300;
                                                                const hFailed = (run.failedCount / maxTotal) * 300;
                                                                const hSkipped = (run.skippedCount / maxTotal) * 300;

                                                                return (
                                                                    <g
                                                                        key={`bar-${run.runId}`}
                                                                        onMouseEnter={() => setHoveredRunIndex(idx)}
                                                                        onMouseLeave={() => setHoveredRunIndex(null)}
                                                                        onClick={() => run.url && window.open(run.url, '_blank')}
                                                                        style={{ cursor: run.url ? 'pointer' : 'default' }}
                                                                    >
                                                                        {hoveredRunIndex === idx && (
                                                                            <rect x={x - 10} y="40" width={barWidth + 20} height="330" fill="rgba(99, 102, 241, 0.05)" rx="16" />
                                                                        )}

                                                                        {/* Pill segments */}
                                                                        <rect x={x} y={350 - hPassed} width={barWidth} height={hPassed} fill="url(#passedPill)" rx={hFailed + hSkipped === 0 ? 8 : 4} />
                                                                        {hFailed > 0 && <rect x={x} y={350 - hPassed - hFailed} width={barWidth} height={hFailed} fill="url(#failedPill)" rx={hSkipped === 0 ? 8 : 4} stroke="white" strokeWidth="1" />}
                                                                        {hSkipped > 0 && <rect x={x} y={350 - hPassed - hFailed - hSkipped} width={barWidth} height={hSkipped} fill="url(#skippedPill)" rx={8} stroke="white" strokeWidth="1" />}

                                                                        <text
                                                                            x={x + barWidth / 2}
                                                                            y={380}
                                                                            textAnchor="middle"
                                                                            fill={hoveredRunIndex === idx ? "#0f172a" : "#cbd5e1"}
                                                                            style={{ fontSize: '11px', fontWeight: 900, transition: 'all 0.2s' }}
                                                                        >
                                                                            #{run.runId}
                                                                        </text>
                                                                    </g>
                                                                );
                                                            })}

                                                            {/* Trend Line */}
                                                            {showPassRate && trendPoints.length > 1 && (
                                                                <g>
                                                                    <path
                                                                        d={`M ${trendPoints[0].x},${trendPoints[0].y} ` + trendPoints.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')}
                                                                        fill="none"
                                                                        stroke="#6366f1"
                                                                        strokeWidth="5"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        style={{ filter: 'drop-shadow(0px 8px 12px rgba(99,102,241,0.4))', transition: 'all 0.6s ease' }}
                                                                    />
                                                                    {trendPoints.map((p, i) => (
                                                                        <circle
                                                                            key={`point-${i}`}
                                                                            cx={p.x}
                                                                            cy={p.y}
                                                                            r={hoveredRunIndex === i ? 9 : 6}
                                                                            fill="white"
                                                                            stroke="#6366f1"
                                                                            strokeWidth="4"
                                                                            style={{ transition: 'all 0.25s ease' }}
                                                                        />
                                                                    ))}
                                                                </g>
                                                            )}

                                                            {!showVolume && data.recentRuns.map((run: any, idx: number) => {
                                                                const x = 60 + (idx * barGap);
                                                                return (
                                                                    <g
                                                                        key={`label-${run.runId}`}
                                                                        onMouseEnter={() => setHoveredRunIndex(idx)}
                                                                        onMouseLeave={() => setHoveredRunIndex(null)}
                                                                        onClick={() => run.url && window.open(run.url, '_blank')}
                                                                        style={{ cursor: run.url ? 'pointer' : 'default' }}
                                                                    >
                                                                        <rect x={x} y="50" width={barWidth} height="300" fill="transparent" />
                                                                        <text x={x + barWidth / 2} y={375} textAnchor="middle" fill={hoveredRunIndex === idx ? "#0f172a" : "#94a3b8"} style={{ fontSize: '10px', fontWeight: 900 }}>#{run.runId}</text>
                                                                    </g>
                                                                );
                                                            })}

                                                            {/* Tooltip Positioning */}
                                                            {hoveredRunIndex !== null && (() => {
                                                                const run = data.recentRuns[hoveredRunIndex];
                                                                const barX = 60 + (hoveredRunIndex * barGap);
                                                                const total = run.passedCount + run.failedCount + run.skippedCount;
                                                                const passRate = ((run.passedCount / Math.max(1, total)) * 100).toFixed(1);

                                                                let tooltipX = barX - 60;
                                                                if (tooltipX < 10) tooltipX = 10;
                                                                if (tooltipX > 620) tooltipX = 620;

                                                                return (
                                                                    <foreignObject x={tooltipX} y={20} width="175" height="135" style={{ pointerEvents: 'none' }}>
                                                                        <Paper
                                                                            elevation={12}
                                                                            sx={{
                                                                                p: 1.5,
                                                                                bgcolor: 'rgba(15, 23, 42, 0.95)',
                                                                                backdropFilter: 'blur(8px)',
                                                                                color: 'white',
                                                                                borderRadius: '16px',
                                                                                border: '1px solid rgba(255,255,255,0.1)'
                                                                            }}
                                                                        >
                                                                            <Typography sx={{ fontSize: '11px', fontWeight: 900, mb: 0.8, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 0.5 }}>BUILD #{run.runId}</Typography>
                                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                                <Typography sx={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>Passed</Typography>
                                                                                <Typography sx={{ fontSize: '10px', fontWeight: 900 }}>{run.passedCount}</Typography>
                                                                            </Box>
                                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                                <Typography sx={{ fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>Failed</Typography>
                                                                                <Typography sx={{ fontSize: '10px', fontWeight: 900 }}>{run.failedCount}</Typography>
                                                                            </Box>
                                                                            {run.skippedCount > 0 && (
                                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                                    <Typography sx={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Skipped</Typography>
                                                                                    <Typography sx={{ fontSize: '10px', fontWeight: 900 }}>{run.skippedCount}</Typography>
                                                                                </Box>
                                                                            )}
                                                                            <Box sx={{ mt: 1, pt: 0.5, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                                                                                <Typography sx={{ fontSize: '10px', fontWeight: 700 }}>Pass Rate</Typography>
                                                                                <Typography sx={{ fontSize: '10px', fontWeight: 900, color: '#6366f1' }}>{passRate}%</Typography>
                                                                            </Box>
                                                                        </Paper>
                                                                    </foreignObject>
                                                                );
                                                            })()}
                                                        </>
                                                    );
                                                })()}
                                            </svg>
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                                Insufficient data for execution history
                                            </Box>
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 5, mt: 5, pb: 1 }}>
                                        {[
                                            { grad: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', l: 'Passed', val: data.recentRuns?.reduce((a: any, b: any) => a + (b.passedCount || 0), 0) },
                                            { grad: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', l: 'Failed', val: data.recentRuns?.reduce((a: any, b: any) => a + (b.failedCount || 0), 0) },
                                            { grad: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)', l: 'Skipped', val: data.recentRuns?.reduce((a: any, b: any) => a + (b.skippedCount || 0), 0) }
                                        ].map(leg => (
                                            <Box key={leg.l} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: leg.grad, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.5px' }}>{leg.l}</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.65rem' }}>{leg.val}</Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Right Panel: Metrics & Analysis */}
                            <Grid size={{ xs: 12, lg: 3 }} sx={{ height: '100%' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', overflowY: 'auto', pr: 1 }}>
                                    {/* Primary Metric Cards in Column */}
                                    {[
                                        { label: 'Baseline Stability', value: `${(85 + data.stabilityDrift).toFixed(1)}%`, sub: 'Current project health', icon: SecurityIcon, color: '#6366f1' },
                                        { label: 'Stability Drift', value: `${data.stabilityDrift > 0 ? '+' : ''}${data.stabilityDrift}%`, sub: 'Relative to history', icon: TrendingUpIcon, color: data.stabilityDrift >= 0 ? '#22c55e' : '#ef4444' },
                                        { label: 'Last Run Health', value: `${data.recentRuns?.[0] ? Math.round((data.recentRuns[0].passedCount / Math.max(1, (data.recentRuns[0].passedCount + data.recentRuns[0].failedCount + data.recentRuns[0].skippedCount))) * 100) : 0}%`, sub: `Build #${data.recentRuns?.[0]?.runId || 'N/A'}`, icon: BoltIcon, color: '#f59e0b' },
                                        { label: 'Active Regressors', value: data.topRegressors?.length || 0, sub: 'Impacted scenarios', icon: BugReportIcon, color: '#ef4444' }
                                    ].map((stat, i) => (
                                        <Paper key={i} sx={{
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
                                                bgcolor: `${stat.color}10`,
                                                color: stat.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <stat.icon sx={{ fontSize: '1.2rem' }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="h5" sx={{ fontWeight: 950, color: '#0f172a', lineHeight: 1.1, fontSize: '1.2rem' }}>{stat.value}</Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.62rem', display: 'block', mt: 0.2 }}>{stat.label}</Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.62rem', fontWeight: 500 }}>{stat.sub}</Typography>
                                            </Box>
                                        </Paper>
                                    ))}
                                    {/* Drift Intelligence */}
                                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', bgcolor: 'white', maxHeight: '40%', display: 'flex', flexDirection: 'column' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}><SentimentVeryDissatisfiedIcon /></Box>
                                            <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1rem' }}>Drift Intelligence</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto' }}>
                                            {data.driftReasons?.map((reason: string, i: number) => (
                                                <Box key={i} sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', gap: 1.5 }}>
                                                    <Box sx={{ mt: 0.5, width: 6, height: 6, borderRadius: '50%', bgcolor: reason.includes('Regression') ? '#ef4444' : '#6366f1', flexShrink: 0 }} />
                                                    <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600, lineHeight: 1.4 }}>{reason}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Paper>

                                    {/* Top Regressors */}
                                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', bgcolor: 'white', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><BugReportIcon /></Box>
                                                <Typography variant="h6" sx={{ fontWeight: 900, fontSize: '1rem' }}>Regression Impact</Typography>
                                            </Box>
                                            <Chip label="Top 5" size="small" sx={{ fontWeight: 800, height: 20, fontSize: '0.65rem' }} />
                                        </Box>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flexGrow: 1 }}>
                                            {data.topRegressors?.length > 0 ? data.topRegressors.slice(0, 5).map((reg: any, i: number) => (
                                                <Box key={i} sx={{ pb: 2, borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b' }} noWrap>{reg.scenarioName}</Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#ef4444' }}>{reg.delta}%</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>{reg.previousPassRate}% → {reg.recentPassRate}%</Typography>
                                                        <LinearProgress variant="determinate" value={reg.recentPassRate} sx={{ flexGrow: 1, height: 4, borderRadius: 2, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#ef4444' } }} />
                                                    </Box>
                                                </Box>
                                            )) : (
                                                <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f8fafc', borderRadius: '16px' }}>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>No active regressions detected</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Dialog>

            {/* Threshold Dialog */}

            <Dialog open={Boolean(thresholdDialog)} onClose={() => setThresholdDialog(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800 }}>Set Expected Duration</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Expected time for <strong>{thresholdDialog?.scenarioName}</strong>.
                            If average execution exceeds this, it will be flagged as a hotspot.
                        </Typography>
                        <TextField
                            fullWidth
                            label="Duration (Seconds)"
                            type="number"
                            value={thresholdDialog ? thresholdDialog.expectedDurationMillis / 1000 : 0}
                            onChange={(e) => setThresholdDialog({ ...thresholdDialog, expectedDurationMillis: parseFloat(e.target.value) * 1000 })}
                            InputProps={{ endAdornment: <InputAdornment position="end">s</InputAdornment> }}
                            autoFocus
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setThresholdDialog(null)} disabled={savingThreshold}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveThreshold}
                        disabled={savingThreshold}
                        sx={{ bgcolor: '#6366f1', fontWeight: 800 }}
                    >
                        {savingThreshold ? <CircularProgress size={20} color="inherit" /> : 'Save Duration'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
