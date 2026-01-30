import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    alpha,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    LinearProgress,
    IconButton,
    Tooltip,
    Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { featureService } from '../services/api';

interface StabilityExplorerViewProps {
    repoUrl: string;
    branch?: string;
    onBack: () => void;
    initialFilter?: 'all' | 'flaky';
    onSync?: () => Promise<void>;
}

export const StabilityExplorerView: FC<StabilityExplorerViewProps> = ({ repoUrl, branch, onBack, initialFilter = 'all', onSync }) => {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [data, setData] = useState<any>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [search, setSearch] = useState('');
    const [onlyFlaky, setOnlyFlaky] = useState(initialFilter === 'flaky');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await featureService.getStabilityExplorer(repoUrl, branch, page, rowsPerPage, debouncedSearch, onlyFlaky);
            setData(res.data);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Error fetching stability explorer:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!onSync) return;
        setSyncing(true);
        try {
            await onSync();
            await fetchData();
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        if (repoUrl) {
            fetchData();
        }
    }, [repoUrl, page, rowsPerPage, debouncedSearch, onlyFlaky]);

    const handleChangePage = (_: any, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1600, mx: 'auto' }}>
            {/* Header Area */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                        onClick={onBack}
                        sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#f8fafc' } }}
                    >
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-1px' }}>
                                Automation Quality Hub
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.8,
                                bgcolor: 'rgba(59, 130, 246, 0.05)',
                                px: 1.2,
                                py: 0.4,
                                borderRadius: '20px',
                                border: '1px solid rgba(59, 130, 246, 0.1)'
                            }}>
                                <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: syncing ? '#3b82f6' : '#22c55e',
                                    animation: syncing ? 'pulse 1.5s infinite' : 'none',
                                    '@keyframes pulse': {
                                        '0%': { opacity: 1, transform: 'scale(1)' },
                                        '50%': { opacity: 0.4, transform: 'scale(1.2)' },
                                        '100%': { opacity: 1, transform: 'scale(1)' }
                                    }
                                }} />
                                <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
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
                                            color: '#3b82f6',
                                            '&:hover': { bgcolor: 'transparent', transform: 'rotate(180deg)' },
                                            transition: 'transform 0.4s'
                                        }}
                                    >
                                        <AutorenewIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                            Deep-dive analysis for {data?.totalCount || 0} scenarios across the project lifecycle
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search scenarios or features..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{
                            width: 300,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'white',
                                borderRadius: 3,
                                '& fieldset': { borderColor: '#e2e8f0' },
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
                    <Button
                        variant={onlyFlaky ? "contained" : "outlined"}
                        onClick={() => {
                            setOnlyFlaky(!onlyFlaky);
                            setPage(0);
                        }}
                        startIcon={<FilterListIcon />}
                        sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 800,
                            bgcolor: onlyFlaky ? '#ef4444' : 'white',
                            color: onlyFlaky ? 'white' : '#1e293b',
                            borderColor: onlyFlaky ? '#ef4444' : '#e2e8f0',
                            '&:hover': {
                                bgcolor: onlyFlaky ? '#dc2626' : '#f8fafc',
                                borderColor: onlyFlaky ? '#dc2626' : '#cbd5e1',
                            }
                        }}
                    >
                        {onlyFlaky ? "High Risk Focus" : "Show High Risk Plan"}
                    </Button>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={fetchData} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* KPI Overview for this page */}
            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', flex: 1, bgcolor: 'white' }}>
                    <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800 }}>Total Scenarios</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b' }}>{data?.totalCount || 0}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', flex: 1, bgcolor: '#f0fdf4' }}>
                    <Typography variant="overline" sx={{ color: '#10b981', fontWeight: 800 }}>Healthy Tests (&gt;90%)</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#047857' }}>
                        {data?.scenarios?.filter((s: any) => s.stabilityScore >= 90).length || 0}
                    </Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', flex: 1, bgcolor: '#fef2f2' }}>
                    <Typography variant="overline" sx={{ color: '#ef4444', fontWeight: 800 }}>High Risk / Flaky</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#991b1b' }}>
                        {data?.scenarios?.filter((s: any) => s.stabilityScore < 80).length || 0}
                    </Typography>
                </Paper>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden', bgcolor: 'white' }}>
                <TableContainer sx={{ minHeight: 600 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#64748b' }}>SCENARIO IDENTIFIER</TableCell>
                                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#64748b' }}>STABILITY SCORE</TableCell>
                                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#64748b' }}>TREND</TableCell>
                                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#64748b' }}>LAST OUTCOME</TableCell>
                                <TableCell sx={{ fontWeight: 800, bgcolor: '#f8fafc', color: '#64748b' }} align="right">RUN HISTORY</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                        <CircularProgress size={40} thickness={5} sx={{ color: '#3b82f6' }} />
                                        <Typography sx={{ mt: 2, color: '#64748b', fontWeight: 600 }}>Analyzing telemetry data...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : data?.scenarios?.map((s: any, idx: number) => (
                                <TableRow key={idx} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>{s.scenarioName}</Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <FilterListIcon sx={{ fontSize: 12 }} /> {s.featureName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ width: 220 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Typography variant="body2" sx={{
                                                fontWeight: 900,
                                                color: s.stabilityScore < 80 ? '#ef4444' : s.stabilityScore < 95 ? '#f59e0b' : '#10b981',
                                                minWidth: 40
                                            }}>
                                                {s.stabilityScore}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={s.stabilityScore}
                                                sx={{
                                                    flexGrow: 1, height: 8, borderRadius: 4, bgcolor: '#f1f5f9',
                                                    '& .MuiLinearProgress-bar': { bgcolor: s.stabilityScore < 80 ? '#ef4444' : s.stabilityScore < 95 ? '#f59e0b' : '#10b981' }
                                                }}
                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {s.trend === 'stable' ? (
                                                <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />} label="Stable" sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 800 }} />
                                            ) : s.trend === 'improving' ? (
                                                <Chip size="small" icon={<TrendingUpIcon sx={{ fontSize: '14px !important' }} />} label="Improving" sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 800 }} />
                                            ) : (
                                                <Chip size="small" icon={<TrendingDownIcon sx={{ fontSize: '14px !important' }} />} label="At Risk" sx={{ bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 800 }} />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={s.lastStatus}
                                            size="small"
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: '0.65rem',
                                                bgcolor: s.lastStatus === 'Passed' ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                                                color: s.lastStatus === 'Passed' ? '#059669' : '#b91c1c'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                                            <HistoryIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#475569' }}>{s.totalRuns} runs</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={data?.totalCount || 0}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[10, 15, 25, 50, 100]}
                    sx={{ borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}
                />
            </Paper>
        </Box>
    );
};
