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
                <CircularProgress thickness={5} size={60} sx={{ color: '#3b82f6' }} />
            </Box>
        );
    }

    const filteredSteps = data?.allSteps?.filter((s: StepData) =>
        s.stepText.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // Pareto Logic for visualization
    const top20Count = Math.ceil(filteredSteps.length * 0.2);

    return (
        <Box sx={{
            p: 2,
            height: '100%',
            overflow: 'hidden',
            bgcolor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
        }}>
            {/* Unified Header Toolbar: Title + Stats + Search */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                bgcolor: 'white',
                p: 1.5,
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                gap: 2
            }}>
                {/* Left Section: Title Group */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Tooltip title="Back to Analytics">
                        <IconButton
                            onClick={onBack}
                            sx={{ bgcolor: '#f8fafc', '&:hover': { bgcolor: '#f1f5f9', transform: 'translateX(-4px)' }, transition: 'all 0.2s', border: '1px solid #e2e8f0', p: 0.8 }}
                        >
                            <ArrowBackIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <FormatListBulletedIcon sx={{ fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 1000, letterSpacing: '-0.5px', color: '#0f172a', lineHeight: 1 }}>
                            Step Intelligence
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: '0.75rem', mt: 0.2 }}>
                            {data?.allSteps?.length || 0} unique automation components
                        </Typography>
                    </Box>
                </Box>

                {/* Center Section: Stats Group */}
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    {/* Total Steps Card */}
                    <Paper elevation={0} sx={{ px: 2.5, py: 1.5, minWidth: 200, borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '7px solid #3b82f6', display: 'flex', alignItems: 'center', gap: 2.5, bgcolor: '#f8fafc' }}>
                        <Tooltip
                            arrow
                            placement="top"
                            title={
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Total Step Definitions</Typography>
                                    <Typography variant="caption" sx={{ display: 'block' }}>
                                        Total count of unique Gherkin sentences backed by automation code.
                                    </Typography>
                                </Box>
                            }
                            slotProps={{ tooltip: { sx: { bgcolor: '#1e293b', borderRadius: '10px', maxWidth: 300 } } }}
                        >
                            <Box sx={{ color: '#3b82f6', display: 'flex', cursor: 'pointer' }}><LayersIcon sx={{ fontSize: 28 }} /></Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', lineHeight: 1, display: 'block' }}>Steps</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1, mt: 0.5 }}>{data?.allSteps?.length || 0}</Typography>
                        </Box>
                    </Paper>

                    {/* ROI Card */}
                    <Paper elevation={0} sx={{ px: 2.5, py: 1.5, minWidth: 200, borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '7px solid #22c55e', display: 'flex', alignItems: 'center', gap: 2.5, bgcolor: '#f8fafc' }}>
                        <Tooltip
                            arrow
                            placement="top"
                            title={
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>ROI Efficiency</Typography>
                                    <Typography variant="caption" sx={{ display: 'block' }}>
                                        Visualizes the "Workhorse" nature of a step.
                                    </Typography>
                                </Box>
                            }
                            slotProps={{ tooltip: { sx: { bgcolor: '#1e293b', borderRadius: '10px', maxWidth: 300 } } }}
                        >
                            <Box sx={{ color: '#22c55e', display: 'flex', cursor: 'pointer' }}><AutoGraphIcon sx={{ fontSize: 28 }} /></Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', lineHeight: 1, display: 'block' }}>ROI</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 950, color: '#22c55e', lineHeight: 1, mt: 0.5 }}>{data?.overallStepReuseROI}%</Typography>
                        </Box>
                    </Paper>

                    {/* Vital Few Card */}
                    <Paper elevation={0} sx={{ px: 2.5, py: 1.5, minWidth: 200, borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '7px solid #f59e0b', display: 'flex', alignItems: 'center', gap: 2.5, bgcolor: '#f8fafc' }}>
                        <Tooltip
                            arrow
                            placement="top"
                            title={
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>The Vital Few</Typography>
                                    <Typography variant="caption" sx={{ display: 'block' }}>
                                        The top 20% of your steps driving 80% of execution.
                                    </Typography>
                                </Box>
                            }
                            slotProps={{ tooltip: { sx: { bgcolor: '#1e293b', borderRadius: '10px', maxWidth: 300 } } }}
                        >
                            <Box sx={{ color: '#f59e0b', display: 'flex', cursor: 'pointer' }}><FormatListBulletedIcon sx={{ fontSize: 28 }} /></Box>
                        </Tooltip>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', lineHeight: 1, display: 'block' }}>Vital Few</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1, mt: 0.5 }}>{top20Count}</Typography>
                        </Box>
                    </Paper>
                </Box>

                {/* Right Section: Tools */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Search steps..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(0);
                        }}
                        sx={{
                            width: 220,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                                bgcolor: '#f8fafc',
                                height: 34,
                                fontSize: '0.85rem',
                                '& fieldset': { borderColor: '#e2e8f0' },
                                '&:hover fieldset': { borderColor: '#cbd5e1' },
                                '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                            }
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
                        sx={{ borderRadius: '8px', px: 2, height: 34, bgcolor: '#0f172a', fontWeight: 900, textTransform: 'none', fontSize: '0.85rem', '&:hover': { bgcolor: '#1e293b' } }}
                    >
                        Sync
                    </Button>
                </Box>
            </Box>



            {/* Main Content Table */}
            <Paper sx={{
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
            }}>
                <TableContainer sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: '8px' },
                    '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: '4px' }
                }}>
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
                                                bgcolor: isVitalFew ? 'rgba(59, 130, 246, 0.1)' : '#f1f5f9',
                                                color: isVitalFew ? '#3b82f6' : '#64748b',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 900, fontSize: '0.8rem',
                                                border: isVitalFew ? '1px solid rgba(59, 130, 246, 0.2)' : 'none'
                                            }}>
                                                {globalIndex + 1}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ py: 2 }}>
                                            <Typography variant="body2" sx={{
                                                fontFamily: 'JetBrains Mono, monospace',
                                                color: '#0f172a',
                                                fontWeight: 500,
                                                fontSize: '1.05rem',
                                                bgcolor: '#f1f5f9',
                                                px: 2,
                                                py: 0.8,
                                                borderRadius: '8px',
                                                display: 'inline-block',
                                                border: '1px solid #e2e8f0',
                                                userSelect: 'text' // Allow copying the actual step data
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
                                                <Typography variant="body2" sx={{ fontWeight: 950, color: '#16a34a', fontSize: '0.85rem', mb: 0.5, userSelect: 'text' }}>
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
                    sx={{
                        borderTop: '1px solid #e2e8f0',
                        bgcolor: 'white',
                        flexShrink: 0,
                        zIndex: 2,
                        position: 'relative'
                    }}
                />
            </Paper>
        </Box>
    );
};
