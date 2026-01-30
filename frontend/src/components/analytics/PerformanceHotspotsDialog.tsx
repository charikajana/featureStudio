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
    Button,
    Dialog,
    Slide,
    TablePagination
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BoltIcon from '@mui/icons-material/Bolt';
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

interface HotspotDetail {
    scenarioName: string;
    featureFile: string;
    averageDurationMillis: number;
    expectedDurationMillis?: number;
    isHotspot: boolean;
    recentHistory?: { status: string; durationMillis: number }[];
}

interface PerformanceHotspotsDialogProps {
    open: boolean;
    onClose: () => void;
    hotspots: HotspotDetail[];
    globalAverage: number;
    onSetThreshold: (hotspot: HotspotDetail) => void;
}

export const PerformanceHotspotsDialog: React.FC<PerformanceHotspotsDialogProps> = ({
    open,
    onClose,
    hotspots,
    globalAverage,
    onSetThreshold
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const filtered = hotspots?.filter(s =>
        s.scenarioName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.featureFile.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={onClose}
            slots={{ transition: Transition }}
            slotProps={{ paper: { sx: { bgcolor: '#f8fafc' } } }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Paper elevation={0} sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Tooltip title="Back to Analytics">
                            <IconButton onClick={onClose} sx={{ bgcolor: '#f1f5f9', color: '#0f172a', '&:hover': { bgcolor: '#e2e8f0', transform: 'translateX(-4px)' } }}>
                                <ArrowBackIcon />
                            </IconButton>
                        </Tooltip>
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            <BoltIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Performance Hotspots</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Global Avg: {(globalAverage / 1000).toFixed(1)}s | {hotspots?.length || 0} Scenarios total</Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <TextField
                            size="small"
                            placeholder="Search scenarios..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                            sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f1f5f9', '& fieldset': { borderColor: 'transparent' } } }}
                            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>) }}
                        />
                        <IconButton onClick={onClose} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, borderRadius: '12px' }}><CloseIcon /></IconButton>
                    </Box>
                </Paper>

                <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
                    <TableContainer component={Paper} sx={{ borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Scenario</TableCell>
                                    <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Avg Execution Time</TableCell>
                                    <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Expected</TableCell>
                                    <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Last 10 Runs</TableCell>
                                    <TableCell align="center" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Status</TableCell>
                                    <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s, idx) => (
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
                                                {s.recentHistory?.map((h, j) => (
                                                    <Tooltip key={j} title={`${h.status} - ${(h.durationMillis / 1000).toFixed(2)}s`}>
                                                        <Box
                                                            sx={{
                                                                width: 10,
                                                                height: 10,
                                                                borderRadius: '2px',
                                                                bgcolor: (h.status === 'Passed' || h.status === 'Succeeded') ? '#22c55e' : '#ef4444'
                                                            }}
                                                        />
                                                    </Tooltip>
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={s.averageDurationMillis > globalAverage * 1.5 ? "Bottleneck" : "Optimal"}
                                                size="small"
                                                sx={{
                                                    fontWeight: 900,
                                                    bgcolor: s.averageDurationMillis > globalAverage * 1.5 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                                    color: s.averageDurationMillis > globalAverage * 1.5 ? '#ef4444' : '#22c55e',
                                                    borderRadius: '6px',
                                                    fontSize: '0.65rem'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                size="small"
                                                variant="text"
                                                onClick={() => onSetThreshold(s)}
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
                        count={filtered.length}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    />
                </Box>
            </Box>
        </Dialog>
    );
};
