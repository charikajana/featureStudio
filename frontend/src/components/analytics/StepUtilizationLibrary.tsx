import React, { useState } from 'react';
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
    Dialog,
    Slide,
    TablePagination
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface StepData {
    stepText: string;
    usageCount: number;
    roiScore: number;
}

interface StepUtilizationLibraryProps {
    open: boolean;
    onClose: () => void;
    steps: StepData[];
    totalScenarios: number;
}

export const StepUtilizationLibrary: React.FC<StepUtilizationLibraryProps> = ({ open, onClose, steps, totalScenarios }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const filteredSteps = steps?.filter(s => s.stepText.toLowerCase().includes(searchTerm.toLowerCase())) || [];

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={onClose}
            slots={{ transition: Transition }}
            slotProps={{
                paper: {
                    sx: { bgcolor: '#f8fafc' }
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                                onClick={onClose}
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
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            <FormatListBulletedIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
                                Step Utilization Library
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                Analyzing {steps?.length || 0} unique automation components
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
                                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
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
                            onClick={onClose}
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
                                {filteredSteps.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((step, index) => {
                                    const globalIndex = page * rowsPerPage + index;
                                    return (
                                        <TableRow key={globalIndex} hover sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell sx={{ py: 1 }}>
                                                <Box sx={{
                                                    width: 24, height: 24, borderRadius: '6px',
                                                    bgcolor: globalIndex < 3 ? 'rgba(59, 130, 246, 0.1)' : '#f1f5f9',
                                                    color: globalIndex < 3 ? '#3b82f6' : '#64748b',
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
                                                    label={`${step.usageCount}/${totalScenarios} Scenarios`}
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
                                                        sx={{ width: 100, height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: '#16a34a' } }}
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
                </Box>
            </Box>
        </Dialog>
    );
};
