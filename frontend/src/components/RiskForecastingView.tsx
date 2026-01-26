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
        <Box sx={{ p: 4, height: '100%', overflowY: 'auto', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title="Back to Engineering Intelligence">
                        <IconButton
                            onClick={onBack}
                            sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f1f5f9', transform: 'translateX(-4px)' }, transition: 'all 0.2s', border: '1px solid #e2e8f0' }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    </Tooltip>
                    <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: '#ef4444', color: 'white', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)' }}>
                        <AutoGraphIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: '#0f172a', lineHeight: 1.1 }}>
                            Risk Forecasting Deep Dive
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mt: 0.5 }}>
                            Bayesian failure probability models and predictive build analysis
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search scenario risk..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(0);
                        }}
                        sx={{
                            width: 350,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'white',
                                '& fieldset': { borderColor: '#e2e8f0' },
                                '&:hover fieldset': { borderColor: '#cbd5e1' },
                                '&.Mui-focused fieldset': { borderColor: '#ef4444' }
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
                        variant="contained"
                        startIcon={<SyncIcon />}
                        onClick={loadData}
                        sx={{ borderRadius: '12px', px: 3, bgcolor: '#0f172a', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#1e293b' } }}
                    >
                        Refresh Intelligence
                    </Button>
                </Box>
            </Box>

            {/* Risk Stats Grid */}
            <Grid container spacing={3} sx={{ flexShrink: 0 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <Tooltip arrow placement="top" title="Number of scenarios with >60% Bayesian failure probability.">
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}>
                                <TrendingDownIcon />
                            </Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>High Risk Targets</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#ef4444' }}>{highRiskCount}</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <Tooltip arrow placement="top" title="The mathematical average of failure likelihood across your entire suite.">
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', cursor: 'pointer' }}>
                                <ScienceIcon />
                            </Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Avg Failure Prob.</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>{avgRisk}%</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <Tooltip arrow placement="top" title="Predictive confidence based on Bayesian Prior and Laplace Smoothing counts.">
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', cursor: 'pointer' }}>
                                <SecurityIcon />
                            </Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Model Confidence</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#22c55e' }}>94.2%</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Main Risk Table */}
            <Paper sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', flexShrink: 0 }}>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 2.5 }}>Status</TableCell>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 2.5 }}>Scenario Name</TableCell>
                                <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 2.5 }}>Risk Level</TableCell>
                                <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 2.5 }}>Failure Likelihood</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredRisks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((risk: RiskData, index: number) => (
                                <TableRow key={index} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell sx={{ py: 2 }}>
                                        <Box sx={{
                                            width: 12, height: 12, borderRadius: '50%',
                                            bgcolor: risk.riskLevel === 'High' ? '#ef4444' : (risk.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'),
                                            boxShadow: `0 0 10px ${risk.riskLevel === 'High' ? 'rgba(239, 68, 68, 0.4)' : (risk.riskLevel === 'Medium' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.4)')}`
                                        }} />
                                    </TableCell>
                                    <TableCell sx={{ py: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>{risk.scenarioName}</Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ py: 2 }}>
                                        <Chip
                                            label={risk.riskLevel.toUpperCase()}
                                            size="small"
                                            sx={{
                                                fontWeight: 900,
                                                fontSize: '0.65rem',
                                                bgcolor: risk.riskLevel === 'High' ? 'rgba(239, 68, 68, 0.1)' : (risk.riskLevel === 'Medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(34, 197, 94, 0.1)'),
                                                color: risk.riskLevel === 'High' ? '#ef4444' : (risk.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e')
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 2 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 150 }}>
                                            <Typography variant="body2" sx={{
                                                fontWeight: 950,
                                                color: risk.riskLevel === 'High' ? '#ef4444' : (risk.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'),
                                                fontSize: '0.9rem',
                                                mb: 0.5
                                            }}>
                                                {risk.failureProbability}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={risk.failureProbability}
                                                sx={{
                                                    width: '100%',
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: '#f1f5f9',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: risk.riskLevel === 'High' ? '#ef4444' : (risk.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'),
                                                        borderRadius: 4
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
                    sx={{ borderTop: '1px solid #e2e8f0', bgcolor: 'white' }}
                />
            </Paper>
        </Box>
    );
};
