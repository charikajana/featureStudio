import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    IconButton,
    Tooltip,
    Dialog,
    Slide
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import BoltIcon from '@mui/icons-material/Bolt';
import BugReportIcon from '@mui/icons-material/BugReport';
import CloseIcon from '@mui/icons-material/Close';
import { ExecutionTrendChart } from './ExecutionTrendChart';
import { MetricCard } from './MetricCard';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface DriftDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    data: any;
}

export const DriftDetailsDialog: React.FC<DriftDetailsDialogProps> = ({ open, onClose, data }) => {
    if (!data) return null;

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
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: data.stabilityDrift >= 0 ? '#22c55e' : '#ef4444' }}>
                            <TrendingUpIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>Stability Drift Analysis</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Deep dive into regression velocity and execution health</Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, borderRadius: '12px' }}><CloseIcon /></IconButton>
                </Paper>

                <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden', bgcolor: '#f8fafc' }}>
                    <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0 }}>
                        <Grid size={{ xs: 12, lg: 9 }} sx={{ height: '100%' }}>
                            <ExecutionTrendChart recentRuns={data.recentRuns} />
                        </Grid>

                        <Grid size={{ xs: 12, lg: 3 }} sx={{ height: '100%' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%', overflowY: 'auto', pr: 1 }}>
                                <MetricCard
                                    label="Baseline Stability"
                                    value={`${(85 + data.stabilityDrift).toFixed(1)}%`}
                                    sub="Current project health"
                                    icon={SecurityIcon}
                                    color="#6366f1"
                                />
                                <MetricCard
                                    label="Stability Drift"
                                    value={`${data.stabilityDrift > 0 ? '+' : ''}${data.stabilityDrift}%`}
                                    sub="Relative to history"
                                    icon={TrendingUpIcon}
                                    color={data.stabilityDrift >= 0 ? '#22c55e' : '#ef4444'}
                                />
                                <MetricCard
                                    label="Last Run Health"
                                    value={`${data.recentRuns?.[0] ? Math.round((data.recentRuns[0].passedCount / Math.max(1, (data.recentRuns[0].passedCount + data.recentRuns[0].failedCount + data.recentRuns[0].skippedCount))) * 100) : 0}%`}
                                    sub={`Build #${data.recentRuns?.[0]?.runId || 'N/A'}`}
                                    icon={BoltIcon}
                                    color="#f59e0b"
                                />
                                <MetricCard
                                    label="Active Regressors"
                                    value={data.topRegressors?.length || 0}
                                    sub="Impacted scenarios"
                                    icon={BugReportIcon}
                                    color="#ef4444"
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Dialog>
    );
};
