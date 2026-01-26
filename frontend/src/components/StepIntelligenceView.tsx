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
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import LayersIcon from '@mui/icons-material/Layers';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import { featureService } from '../services/api';

interface StepIntelligenceViewProps {
    repoUrl: string;
    branch: string;
    onBack: () => void;
}

interface StepData {
    stepText: string;
    usageCount: number;
    roiScore: number;
}

export const StepIntelligenceView: React.FC<StepIntelligenceViewProps> = ({ repoUrl, branch, onBack }) => {
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
                <CircularProgress thickness={5} size={60} sx={{ color: '#6366f1' }} />
            </Box>
        );
    }

    const filteredSteps = data?.allSteps?.filter((s: StepData) =>
        s.stepText.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // Pareto Logic for visualization
    const top20Count = Math.ceil(filteredSteps.length * 0.2);

    return (
        <Box sx={{ p: 4, height: '100%', overflowY: 'auto', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 4, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: '4px' } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title="Back to Analytics">
                        <IconButton
                            onClick={onBack}
                            sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f1f5f9', transform: 'translateX(-4px)' }, transition: 'all 0.2s', border: '1px solid #e2e8f0' }}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    </Tooltip>
                    <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: '#6366f1', color: 'white', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
                        <FormatListBulletedIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1.5px', color: '#0f172a', lineHeight: 1.1 }}>
                            Step Intelligence Library
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mt: 0.5 }}>
                            Analyzing {data?.allSteps?.length || 0} unique automation components across your project
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search step definition..."
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
                    <Button
                        variant="contained"
                        startIcon={<SyncIcon />}
                        onClick={loadData}
                        sx={{ borderRadius: '12px', px: 3, bgcolor: '#0f172a', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#1e293b' } }}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            {/* Quick Stats Grid */}
            <Grid container spacing={3} sx={{ flexShrink: 0 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <Tooltip
                            arrow
                            placement="top"
                            title={
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Total Step Definitions</Typography>
                                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                        Total count of unique Gherkin sentences backed by automation code.
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block' }}>
                                        Framework Health: A lean library with high reuse (ROI) is easier to maintain than a bloated one with thousands of one-off steps.
                                    </Typography>
                                </Box>
                            }
                            slotProps={{ tooltip: { sx: { bgcolor: '#1e293b', borderRadius: '12px', maxWidth: 300 } } }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', cursor: 'pointer' }}>
                                <LayersIcon />
                            </Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Total Step Definitions</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>{data?.allSteps?.length || 0}</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <Tooltip
                            arrow
                            placement="top"
                            title={
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>ROI Efficiency</Typography>
                                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                        This percentage visualizes the "Workhorse" nature of a step.
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                        <strong>83.0% ROI:</strong> Highly efficient; services nearly your entire project.
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block' }}>
                                        <strong>17.0% ROI:</strong> Single-purpose; only used in one scenario.
                                    </Typography>
                                </Box>
                            }
                            slotProps={{ tooltip: { sx: { bgcolor: '#1e293b', borderRadius: '12px', maxWidth: 300 } } }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', cursor: 'pointer' }}>
                                <AutoGraphIcon />
                            </Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Global ROI Score</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#22c55e' }}>{data?.overallStepReuseROI}%</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <Tooltip
                            arrow
                            placement="top"
                            title={
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>The Vital Few (Pareto Principle)</Typography>
                                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                        The top 20% of your steps that drive 80% of your test suite's execution.
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#f59e0b' }}>
                                        Actionable: Focus your performance and stability fixes here for the highest return on engineering effort.
                                    </Typography>
                                </Box>
                            }
                            slotProps={{ tooltip: { sx: { bgcolor: '#1e293b', borderRadius: '12px', maxWidth: 300 } } }}
                        >
                            <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', cursor: 'pointer' }}>
                                <FormatListBulletedIcon />
                            </Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>"Vital Few" Steps</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 900 }}>{top20Count}</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Main Content Table */}
            <Paper sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', flexShrink: 0 }}>
                <TableContainer>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 2.5 }}>Rank</TableCell>
                                <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 2.5 }}>Step Gherkin Sentence</TableCell>
                                <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 2.5 }}>Usage Density</TableCell>
                                <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem', py: 2.5 }}>ROI Efficiency</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredSteps.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((step: StepData, index: number) => {
                                const globalIndex = page * rowsPerPage + index;
                                const isVitalFew = globalIndex < top20Count;
                                return (
                                    <TableRow key={globalIndex} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell sx={{ py: 2 }}>
                                            <Box sx={{
                                                width: 32, height: 32, borderRadius: '10px',
                                                bgcolor: isVitalFew ? 'rgba(99, 102, 241, 0.1)' : '#f1f5f9',
                                                color: isVitalFew ? '#6366f1' : '#64748b',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 900, fontSize: '0.8rem',
                                                border: isVitalFew ? '1px solid rgba(99, 102, 241, 0.2)' : 'none'
                                            }}>
                                                {globalIndex + 1}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 2 }}>
                                            <Typography variant="body2" sx={{
                                                fontFamily: 'JetBrains Mono, monospace',
                                                color: '#0f172a',
                                                fontWeight: 700,
                                                fontSize: '0.95rem',
                                                bgcolor: '#f1f5f9',
                                                px: 2,
                                                py: 0.8,
                                                borderRadius: '8px',
                                                display: 'inline-block',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                {step.stepText}
                                            </Typography>
                                            {isVitalFew && (
                                                <Chip
                                                    label="VITAL FEW"
                                                    size="small"
                                                    sx={{ ml: 2, height: 20, fontSize: '0.6rem', fontWeight: 900, bgcolor: '#0f172a', color: 'white', borderRadius: '4px' }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell align="center" sx={{ py: 2 }}>
                                            <Chip
                                                label={`${step.usageCount}/${data.totalScenarios} Scenarios`}
                                                size="small"
                                                sx={{ fontWeight: 800, bgcolor: '#eff6ff', color: '#3b82f6', borderRadius: '6px', px: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right" sx={{ py: 2 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 120 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 950, color: '#16a34a', fontSize: '0.85rem', mb: 0.5 }}>
                                                    {(step.roiScore * 10).toFixed(1)}%
                                                </Typography>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={step.roiScore * 10}
                                                    sx={{
                                                        width: '100%',
                                                        height: 8,
                                                        borderRadius: 4,
                                                        bgcolor: '#f1f5f9',
                                                        '& .MuiLinearProgress-bar': { bgcolor: '#16a34a', borderRadius: 4 }
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
                <TablePagination
                    component="div"
                    count={filteredSteps.length}
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
