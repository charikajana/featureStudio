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
        <Box sx={{ p: 2, maxWidth: 1400, mx: 'auto' }}>
            {/* Header section with Stability Drift */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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

                <Paper sx={{
                    py: 1.25,
                    px: 2.5,
                    borderRadius: '16px',
                    bgcolor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid',
                    borderColor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        bgcolor: data.stabilityDrift >= 0 ? '#22c55e' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: `0 4px 10px ${data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                        <TrendingUpIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.75px', fontSize: '0.65rem', display: 'block', mb: 0.25 }}>
                            Stability Drift
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 950, color: data.stabilityDrift >= 0 ? '#16a34a' : '#dc2626', fontSize: '1.1rem', lineHeight: 1 }}>
                                {data.stabilityDrift > 0 ? '+' : ''}{data.stabilityDrift}%
                            </Typography>
                            <Chip
                                size="small"
                                label={data.driftStatus}
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 900,
                                    bgcolor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: data.stabilityDrift >= 0 ? '#14532d' : '#7f1d1d',
                                    borderRadius: '6px'
                                }}
                            />
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <Grid container spacing={3}>
                {/* 1. Fragility Index Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 4, borderRadius: '24px', height: '100%', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
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

                        <TableContainer>
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
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 4, borderRadius: '24px', height: '100%', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                    <BoltIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e293b' }}>Execution Hotspots</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Scenarios exceeding global avg ({(data.globalAverageDurationMillis / 1000).toFixed(1)}s)</Typography>
                                </Box>
                            </Box>
                            <Button
                                size="small"
                                onClick={() => setIsPerformanceOpen(true)}
                                sx={{ fontWeight: 800, textTransform: 'none', color: '#6366f1' }}
                            >
                                View All
                            </Button>
                        </Box>

                        <TableContainer>
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
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>{s.scenarioName}</Typography>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>{s.featureFile}</Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        {s.recentHistory?.map((h: any, j: number) => (
                                                            <Tooltip key={j} title={`${h.status} - ${(h.durationMillis / 1000).toFixed(2)}s (${new Date(h.timestamp).toLocaleString()})`}>
                                                                <Box
                                                                    sx={{
                                                                        width: 8,
                                                                        height: 8,
                                                                        borderRadius: '2px',
                                                                        bgcolor: h.status === 'Passed' ? '#22c55e' : '#ef4444'
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        ))}
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell align="right" sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 900, color: '#ef4444' }}>
                                                        {(s.averageDurationMillis / 1000).toFixed(1)}s
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.65rem' }}>
                                                        {s.expectedDurationMillis ? `Goal: ${(s.expectedDurationMillis / 1000).toFixed(1)}s` : `Avg: ${(data.globalAverageDurationMillis / 1000).toFixed(1)}s`}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {data.executionHotspots.filter((s: any) => s.isHotspot).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body2" color="text.secondary">All scenarios performing within expected time.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* 3. Automation ROI and Counts (COMPACTED) */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                                    <AutorenewIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e293b' }}>Automation Efficiency</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Strategic project metrics and step reuse analysis</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>Efficiency ROI</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 950, color: '#22c55e' }}>{data.overallStepReuseROI}%</Typography>
                                </Box>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => setIsDeepDiveOpen(true)}
                                    sx={{
                                        borderRadius: '10px',
                                        fontWeight: 800,
                                        textTransform: 'none',
                                        bgcolor: '#3b82f6',
                                        color: 'white',
                                        '&:hover': { bgcolor: '#2563eb', transform: 'translateY(-1px)' },
                                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                                        transition: 'all 0.2s',
                                        gap: 1
                                    }}
                                >
                                    <LaunchIcon sx={{ fontSize: 16 }} />
                                    Deep Dive
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 3,
                            p: 2.5,
                            borderRadius: '18px',
                            bgcolor: '#f8fafc',
                            border: '1px solid #f1f5f9'
                        }}>
                            <Tooltip title="Click to view all feature files" arrow>
                                <Box
                                    onClick={() => setIsFeatureFilesOpen(true)}
                                    sx={{
                                        cursor: 'pointer',
                                        flex: 1,
                                        minWidth: 140,
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            '& > div > div:first-of-type': { bgcolor: 'rgba(99, 102, 241, 0.2)' }
                                        },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <StatItem icon={DescriptionIcon} label="Feature Files" value={data.totalFeatures} color="#6366f1" />
                                </Box>
                            </Tooltip>
                            <Tooltip title="Click to view all scenarios" arrow>
                                <Box
                                    onClick={() => setIsScenariosOpen(true)}
                                    sx={{
                                        cursor: 'pointer', flex: 1, minWidth: 140,
                                        '&:hover': { transform: 'translateY(-2px)', '& > div > div:first-of-type': { bgcolor: 'rgba(59, 130, 246, 0.2)' } },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <StatItem icon={FormatListBulletedIcon} label="Scenarios" value={data.totalScenarios} color="#3b82f6" />
                                </Box>
                            </Tooltip>
                            <Tooltip title="Click to view all scenario outlines" arrow>
                                <Box
                                    onClick={() => setIsOutlinesOpen(true)}
                                    sx={{
                                        cursor: 'pointer', flex: 1, minWidth: 140,
                                        '&:hover': { transform: 'translateY(-2px)', '& > div > div:first-of-type': { bgcolor: 'rgba(139, 92, 246, 0.2)' } },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <StatItem icon={QuizIcon} label="Outlines" value={data.totalScenarioOutlines} color="#8b5cf6" />
                                </Box>
                            </Tooltip>
                            <Tooltip title="Click to view step utilization library" arrow>
                                <Box
                                    onClick={() => setIsDeepDiveOpen(true)}
                                    sx={{
                                        cursor: 'pointer', flex: 1, minWidth: 140,
                                        '&:hover': { transform: 'translateY(-2px)', '& > div > div:first-of-type': { bgcolor: 'rgba(34, 197, 94, 0.2)' } },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <StatItem icon={LaunchIcon} label="Total Steps" value={data.totalSteps} color="#22c55e" />
                                </Box>
                            </Tooltip>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Step Deep Dive Full-Screen Dialog */}
            <Dialog
                fullScreen
                open={isDeepDiveOpen}
                onClose={() => setIsDeepDiveOpen(false)}
                TransitionComponent={Transition}
                PaperProps={{
                    sx: { bgcolor: '#f8fafc' }
                }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Sticky Header */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'sticky',
                            top: 0,
                            zIndex: 10,
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
                TransitionComponent={Transition}
                PaperProps={{ sx: { bgcolor: '#f8fafc' } }}
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
                TransitionComponent={Transition}
                PaperProps={{ sx: { bgcolor: '#f8fafc' } }}
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
                TransitionComponent={Transition}
                PaperProps={{ sx: { bgcolor: '#f8fafc' } }}
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
                TransitionComponent={Transition}
                PaperProps={{ sx: { bgcolor: '#f8fafc' } }}
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
        </Box>
    );
};
