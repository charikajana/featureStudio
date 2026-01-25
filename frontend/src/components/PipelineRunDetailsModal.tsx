import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Chip,
    CircularProgress,
    Paper,
    alpha
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TagIcon from '@mui/icons-material/Tag';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { featureService } from '../services/api';

interface PipelineRunDetailsModalProps {
    open: boolean;
    onClose: () => void;
    runId: number | null;
    repoUrl: string;
}

interface RunDetails {
    runId: number;
    buildNumber: string;
    state: string; // notStarted, inProgress, completed
    result?: string; // succeeded, failed, canceled
    createdDate: string;
    finishedDate?: string;
    url: string;
    testResults?: {
        totalTests: number;
        passed: number;
        failed: number;
        skipped: number;
        passRate: number;
    };
}

export const PipelineRunDetailsModal: FC<PipelineRunDetailsModalProps> = ({
    open,
    onClose,
    runId,
    repoUrl
}) => {
    const [details, setDetails] = useState<RunDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && runId) {
            fetchDetails();
            // Poll every 5 seconds if pipeline is still running
            const interval = setInterval(() => {
                if (details?.state === 'inProgress') {
                    fetchDetails();
                }
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [open, runId, details?.state]);

    const fetchDetails = async () => {
        if (!runId) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await featureService.getPipelineRunDetails(runId, repoUrl);
            setDetails(data);
        } catch (e: any) {
            setError(e.response?.data || 'Failed to fetch pipeline details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (state: string, result?: string) => {
        if (state === 'completed') {
            if (result === 'succeeded') return '#10b981';
            if (result === 'failed') return '#ef4444';
            return '#6b7280';
        }
        if (state === 'inProgress') return '#3b82f6';
        return '#9ca3af';
    };

    const getStatusIcon = (state: string, result?: string) => {
        if (state === 'completed') {
            if (result === 'succeeded') return <CheckCircleIcon sx={{ color: '#10b981' }} />;
            if (result === 'failed') return <ErrorIcon sx={{ color: '#ef4444' }} />;
        }
        if (state === 'inProgress') return <CircularProgress size={20} />;
        return <PendingIcon sx={{ color: '#9ca3af' }} />;
    };

    const formatDuration = (start: string, end?: string) => {
        if (!end) return 'In progress...';
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const durationMs = endTime - startTime;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                fontWeight: 900,
                color: '#0f172a',
                bgcolor: '#f8fafc',
                py: 3,
                borderBottom: '1px solid #e2e8f0',
                letterSpacing: '-0.5px'
            }}>
                <Box sx={{
                    width: 44, height: 44,
                    borderRadius: '12px',
                    bgcolor: details ? alpha(getStatusColor(details.state, details.result), 0.1) : '#f1f5f9',
                    color: details ? getStatusColor(details.state, details.result) : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {details ? getStatusIcon(details.state, details.result) : <PendingIcon />}
                </Box>
                Run Details
            </DialogTitle>

            <DialogContent sx={{ mt: 3, px: 3, pb: 2 }}>
                {loading && !details && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
                        <CircularProgress size={40} thickness={5} sx={{ color: '#6366f1' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>Fetching build artifacts...</Typography>
                    </Box>
                )}

                {error && (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <ErrorIcon sx={{ fontSize: 48, color: '#ef4444', mb: 2, opacity: 0.5 }} />
                        <Typography color="error" sx={{ fontWeight: 700 }}>
                            {error}
                        </Typography>
                    </Box>
                )}

                {details && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                        {/* Build Info Card */}
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TagIcon sx={{ fontSize: 14 }} /> Build
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>
                                        {details.buildNumber}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={details.state === 'completed' ? details.result?.toUpperCase() : details.state?.toUpperCase()}
                                    sx={{
                                        bgcolor: details ? getStatusColor(details.state, details.result) : '#94a3b8',
                                        color: 'white',
                                        fontWeight: 900,
                                        fontSize: '0.65rem',
                                        height: 24,
                                        px: 1,
                                        boxShadow: `0 4px 6px -1px ${alpha(getStatusColor(details.state, details.result), 0.3)}`
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8' }}>EXECUTION ID</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                        #{details.runId}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AccessTimeIcon sx={{ fontSize: 12 }} /> TOTAL DURATION
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                        {formatDuration(details.createdDate, details.finishedDate)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>

                        {/* Test Results Viz */}
                        {details.testResults && details.testResults.totalTests > 0 && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                        Test Suite Analysis
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#10b981' }}>
                                        {details.testResults.passRate.toFixed(1)}% SUCCESS
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                    {/* Donut Segments simulation with linear bar for simplicity but highly styled */}
                                    <Box sx={{ flex: 1, height: 12, bgcolor: '#f1f5f9', borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                                        <Box sx={{ width: `${(details.testResults.passed / details.testResults.totalTests) * 100}%`, bgcolor: '#10b981', transition: 'width 1s ease-in-out' }} />
                                        <Box sx={{ width: `${(details.testResults.failed / details.testResults.totalTests) * 100}% `, bgcolor: '#ef4444', transition: 'width 1s ease-in-out' }} />
                                        <Box sx={{ width: `${(details.testResults.skipped / details.testResults.totalTests) * 100}%`, bgcolor: '#f59e0b', transition: 'width 1s ease-in-out' }} />
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                                    <Box sx={{ textAlign: 'center', p: 2, borderRadius: 3, bgcolor: '#white', border: '1px solid #f1f5f9' }}>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#10b981', lineHeight: 1, mb: 0.5 }}>
                                            {details.testResults.passed}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Passed</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center', p: 2, borderRadius: 3, bgcolor: '#white', border: '1px solid #f1f5f9' }}>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#ef4444', lineHeight: 1, mb: 0.5 }}>
                                            {details.testResults.failed}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Failed</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center', p: 2, borderRadius: 3, bgcolor: '#white', border: '1px solid #f1f5f9' }}>
                                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#f59e0b', lineHeight: 1, mb: 0.5 }}>
                                            {details.testResults.skipped}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Skipped</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}

                        <Button
                            variant="contained"
                            onClick={() => window.open(details.url, '_blank')}
                            fullWidth
                            sx={{
                                borderRadius: '12px',
                                py: 1.5,
                                fontWeight: 900,
                                bgcolor: '#0f172a',
                                boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)',
                                '&:hover': { bgcolor: '#1e293b', boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.3)' }
                            }}
                            endIcon={<OpenInNewIcon sx={{ fontSize: 18 }} />}
                        >
                            Open Test Reports
                        </Button>

                        {details.state === 'inProgress' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 1 }}>
                                <CircularProgress size={12} thickness={6} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#3b82f6', letterSpacing: '0.02em' }}>
                                    Live tracking build progress...
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Button onClick={onClose} sx={{ fontWeight: 800, color: '#64748b' }}>Dismiss</Button>
            </DialogActions>
        </Dialog>
    );
};
