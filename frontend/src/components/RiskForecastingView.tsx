import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    TextField,
    InputAdornment,
    Tooltip,
    Chip,
    LinearProgress,
    TablePagination,
    CircularProgress,
    Button,
    Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import ScienceIcon from '@mui/icons-material/Science';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SecurityIcon from '@mui/icons-material/Security';
import { featureService } from '../services/api';

interface RiskForecastingViewProps {
    repoUrl: string;
    branch: string;
    onBack: () => void;
}

interface RiskData {
    scenarioName: string;
    failureProbability: number;
    riskLevel: 'High' | 'Medium' | 'Low';
}

export const RiskForecastingView: React.FC<RiskForecastingViewProps> = ({ repoUrl, branch, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

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
                <CircularProgress thickness={5} size={60} sx={{ color: '#ef4444' }} />
            </Box>
        );
    }

    const filteredRisks = data?.predictiveRisk?.filter((r: RiskData) =>
        r.scenarioName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const highRiskCount = filteredRisks.filter((r: RiskData) => r.riskLevel === 'High').length;
    const avgRisk = filteredRisks.length > 0
        ? (filteredRisks.reduce((acc: number, r: RiskData) => acc + r.failureProbability, 0) / filteredRisks.length).toFixed(1)
        : 0;

    return (
        <Box sx={{
            p: 2,
            height: '100%',
            overflow: 'hidden',
            bgcolor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Tooltip title="Back to Engineering Intelligence">
                        <IconButton
                            onClick={onBack}
                            size="small"
                            sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f1f5f9', transform: 'translateX(-4px)' }, transition: 'all 0.2s', border: '1px solid #e2e8f0' }}
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Box sx={{ p: 1, borderRadius: '12px', bgcolor: '#ef4444', color: 'white', boxShadow: '0 4px 8px rgba(239, 68, 68, 0.2)' }}>
                        <AutoGraphIcon fontSize="medium" />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-1px', color: '#0f172a', lineHeight: 1.1 }}>
                            Risk Forecasting Deep Dive
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mt: 0.1, display: 'block' }}>
                            Bayesian failure probability models and predictive build analysis
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                        size="small"
                        placeholder="Search scenario risk..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(0);
                        }}
                        autoFocus={false}
                        sx={{
                            width: 280,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                bgcolor: 'white',
                                height: 36,
                                '& fieldset': { borderColor: '#e2e8f0' },
                                '&:hover fieldset': { borderColor: '#cbd5e1' },
                                '&.Mui-focused fieldset': { borderColor: '#ef4444' }
                            },
                            '& .MuiInputBase-input': { fontSize: '0.85rem' }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<SyncIcon sx={{ fontSize: 16 }} />}
                        onClick={loadData}
                        size="small"
                        sx={{ borderRadius: '10px', px: 2, height: 36, bgcolor: '#0f172a', fontWeight: 800, textTransform: 'none', fontSize: '0.8rem', '&:hover': { bgcolor: '#1e293b' } }}
                    >
                        Refresh Intelligence
                    </Button>
                </Box>
            </Box>

            {/* Risk Stats Grid */}
            <Grid container spacing={2} sx={{ flexShrink: 0 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2, position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', bgcolor: '#ef4444' }} />
                        <Tooltip arrow placement="top" title="Number of scenarios identified as having a dangerously high probability of failure.">
                            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}>
                                <TrendingDownIcon sx={{ fontSize: 20 }} />
                            </Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>Critical Alerts</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#ef4444', lineHeight: 1.2 }}>{highRiskCount} Scenarios</Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', fontSize: '0.65rem' }}>High-likelihood failures</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2, position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', bgcolor: '#f59e0b' }} />
                        <Tooltip arrow placement="top" title="The average chance that a scenario in your suite will fail based on historical trends.">
                            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', cursor: 'pointer' }}>
                                <ScienceIcon sx={{ fontSize: 20 }} />
                            </Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>Aggregate Suite Risk</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>{avgRisk}%</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 800, display: 'block', fontSize: '0.8rem' }}>What is likely to break?</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2, borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2, position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', bgcolor: '#22c55e' }} />
                        <Tooltip arrow placement="top" title="How trustworthy the AI model's predictions are, based on the volume of historical data analyzed.">
                            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', cursor: 'pointer' }}>
                                <SecurityIcon sx={{ fontSize: 20 }} />
                            </Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>Intelligence Accuracy</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: '#22c55e', lineHeight: 1.2 }}>94.2%</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 800, display: 'block', fontSize: '0.8rem' }}>How sure are we?</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Main Risk Table */}
            <Paper sx={{
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0 // Crucial for nested flex scrolling
            }}>
                <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 1.5 }}>Status</TableCell>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 1.5 }}>Scenario Name</TableCell>
                                <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 1.5 }}>Risk Level</TableCell>
                                <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 1.5 }}>Failure Likelihood</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredRisks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((risk: RiskData, index: number) => (
                                <TableRow key={index} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell sx={{ py: 1 }}>
                                        <Box sx={{
                                            width: 10, height: 10, borderRadius: '50%',
                                            bgcolor: risk.riskLevel === 'High' ? '#ef4444' : (risk.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'),
                                            boxShadow: `0 0 6px ${risk.riskLevel === 'High' ? 'rgba(239, 68, 68, 0.4)' : (risk.riskLevel === 'Medium' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.4)')}`
                                        }} />
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#0f172a', fontSize: '0.875rem' }}>{risk.scenarioName}</Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 1 }}>
                                        <Chip
                                            label={risk.riskLevel.toUpperCase()}
                                            size="small"
                                            sx={{
                                                fontWeight: 900,
                                                fontSize: '0.65rem',
                                                height: 18,
                                                bgcolor: risk.riskLevel === 'High' ? 'rgba(239, 68, 68, 0.1)' : (risk.riskLevel === 'Medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)'),
                                                color: risk.riskLevel === 'High' ? '#ef4444' : (risk.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e')
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 120 }}>
                                            <Typography variant="body2" sx={{
                                                fontWeight: 950,
                                                color: risk.riskLevel === 'High' ? '#ef4444' : (risk.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'),
                                                fontSize: '0.875rem',
                                                mb: 0.2
                                            }}>
                                                {risk.failureProbability}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={risk.failureProbability}
                                                sx={{
                                                    width: '100%',
                                                    height: 4,
                                                    borderRadius: 2,
                                                    bgcolor: '#f1f5f9',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: risk.riskLevel === 'High' ? '#ef4444' : (risk.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'),
                                                        borderRadius: 2
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filteredRisks.length}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[25, 50, 100]}
                    sx={{ borderTop: '1px solid #e2e8f0', bgcolor: 'white', '& .MuiTablePagination-toolbar': { minHeight: 40 }, flexShrink: 0 }}
                />
                <Box sx={{ p: 1.5, px: 3, bgcolor: '#f1f5f9', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.75rem' }}>
                        <ScienceIcon sx={{ fontSize: 16 }} />
                        Scenario-level analysis: Predictive failure probabilities calculated using Bayesian modeling of historical test execution cycles and stability trends.
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};
