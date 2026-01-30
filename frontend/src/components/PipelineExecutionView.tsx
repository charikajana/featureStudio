import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    CircularProgress,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Tooltip,
    alpha
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { featureService } from '../services/api';
import { PipelineRunDetailsModal } from './PipelineRunDetailsModal';

interface PipelineExecutionViewProps {
    repoUrl: string;
    runId?: number | null;
}

interface RunSummary {
    runId: number;
    buildNumber: string;
    state: string;
    result?: string;
    createdDate: string;
    finishedDate?: string;
    url: string;
    triggeredBy?: string;
    testsPassed?: number | null;
    testsFailed?: number | null;
    testsSkipped?: number | null;
    testsTotal?: number | null;
}

export const PipelineExecutionView: FC<PipelineExecutionViewProps> = ({
    repoUrl,
    runId
}) => {
    const [runs, setRuns] = useState<RunSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [availableRepos, setAvailableRepos] = useState<any[]>([]);
    const [selectedRepoUrl, setSelectedRepoUrl] = useState<string>('');
    const [loadingRepos, setLoadingRepos] = useState(false);

    useEffect(() => {
        if (runId) {
            setSelectedRunId(Number(runId));
            setDetailsModalOpen(true);
        }
    }, [runId]);


    // Use repoUrl from props, or selected repo, or localStorage
    const effectiveRepoUrl = repoUrl || selectedRepoUrl || localStorage.getItem('pipelineViewRepoUrl') || '';

    // Fetch available repositories on mount and auto-select first one if available
    useEffect(() => {
        const fetchAvailableRepos = async () => {
            setLoadingRepos(true);
            try {
                const { data } = await featureService.getRepositories();
                setAvailableRepos(data);

                // Auto-select logic: stored > first available
                const stored = localStorage.getItem('pipelineViewRepoUrl');
                if (stored && data.some((r: any) => r.repositoryUrl === stored)) {
                    setSelectedRepoUrl(stored);
                } else if (data.length > 0 && !selectedRepoUrl) {
                    // Automatically select first repository if none is selected
                    const firstRepo = data[0].repositoryUrl;
                    setSelectedRepoUrl(firstRepo);
                    localStorage.setItem('pipelineViewRepoUrl', firstRepo);
                }
            } catch (e) {
                console.error('Failed to fetch repositories', e);
            } finally {
                setLoadingRepos(false);
            }
        };

        if (!repoUrl) {
            fetchAvailableRepos();
        }
    }, [repoUrl]);

    useEffect(() => {
        if (effectiveRepoUrl) {
            fetchRuns();
        }
    }, [effectiveRepoUrl]);

    // Auto-refresh in-progress runs
    useEffect(() => {
        const interval = setInterval(() => {
            const hasInProgress = runs.some(r => r.state === 'inProgress');
            if (hasInProgress) {
                fetchRuns();
            }
        }, 10000); // Refresh every 10 seconds

        return () => clearInterval(interval);
    }, [runs]);

    const fetchRuns = async () => {
        if (!effectiveRepoUrl) return;
        setLoading(true);
        setError('');
        try {
            const { data } = await featureService.listPipelineRuns(effectiveRepoUrl, 100);
            // Sort by createdDate descending (newest first)
            const sortedRuns = data.sort((a, b) => {
                return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
            });
            setRuns(sortedRuns);
        } catch (e: any) {
            setError(e.response?.data || 'Failed to fetch pipeline runs');
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
            if (result === 'succeeded') return <CheckCircleIcon sx={{ fontSize: 20, color: '#10b981' }} />;
            if (result === 'failed') return <ErrorIcon sx={{ fontSize: 20, color: '#ef4444' }} />;
        }
        if (state === 'inProgress') return <CircularProgress size={18} />;
        return <PendingIcon sx={{ fontSize: 20, color: '#9ca3af' }} />;
    };

    const formatDuration = (start: string, end?: string) => {
        if (!end) return 'Running...';
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const durationMs = endTime - startTime;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const handleRowClick = (id: number) => {
        setSelectedRunId(id);
        setDetailsModalOpen(true);
    };

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (!effectiveRepoUrl) {
        return (
            <Box sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 3,
                p: 4,
                bgcolor: '#f8f9fa'
            }}>
                <PlayCircleOutlineIcon sx={{ fontSize: 80, color: '#9ca3af' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#6b7280' }}>
                    Select a Repository
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 500 }}>
                    Choose a repository below to view its pipeline execution history
                </Typography>

                {loadingRepos ? (
                    <CircularProgress size={40} />
                ) : availableRepos.length > 0 ? (
                    <Box sx={{ maxWidth: 600, width: '100%' }}>
                        {availableRepos.map((repo: any) => (
                            <Paper
                                key={repo.id}
                                sx={{
                                    p: 2,
                                    mb: 2,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: 3,
                                        bgcolor: alpha('#3b82f6', 0.05)
                                    }
                                }}
                                onClick={() => {
                                    setSelectedRepoUrl(repo.repositoryUrl);
                                    localStorage.setItem('pipelineViewRepoUrl', repo.repositoryUrl);
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {repo.repositoryUrl.split('/').pop() || 'Repository'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {repo.repositoryUrl}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No repositories configured. Please ask an administrator to set up a repository.
                    </Typography>
                )}
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <ErrorIcon sx={{ fontSize: 60, color: '#ef4444', mb: 2 }} />
                <Typography variant="h6" color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
                <Button variant="contained" onClick={fetchRuns} startIcon={<RefreshIcon />}>
                    Retry
                </Button>
            </Box>
        );
    }

    if (loading && runs.length === 0) {
        return (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    const paginatedRuns = runs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#f1f5f9', p: 2 }}>
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                {/* Premium Header */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography className="brand-font" variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', mb: 0.5 }}>
                            Pipeline Monitoring
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                px: 1.5, py: 0.5, borderRadius: '20px',
                                bgcolor: '#e2e8f0', color: '#475569'
                            }}>
                                <PlayCircleOutlineIcon sx={{ fontSize: 16 }} />
                                <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                    {effectiveRepoUrl.split('/').pop()?.replace('.git', '')}
                                </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                                {runs.length} orchestration cycles discovered
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={fetchRuns}
                            startIcon={<RefreshIcon />}
                            disabled={loading}
                            sx={{
                                borderRadius: '12px',
                                fontWeight: 800,
                                borderColor: '#e2e8f0',
                                color: '#475569',
                                bgcolor: 'white',
                                '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                            }}
                        >
                            Sync History
                        </Button>
                    </Box>
                </Box>

                {/* Statistics Command Center */}
                {runs.length > 0 && (
                    <Paper elevation={0} sx={{
                        p: 2, mb: 2, borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        bgcolor: 'white',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                    }}>
                        <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {/* Circular Diagnostic */}
                            <Box sx={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                                {(() => {
                                    const succeeded = runs.filter(r => r.result === 'succeeded').length;
                                    const failed = runs.filter(r => r.result === 'failed').length;
                                    const total = runs.length || 1;

                                    const succeededPercent = (succeeded / total) * 100;
                                    const failedPercent = (failed / total) * 100;

                                    return (
                                        <>
                                            <Box
                                                sx={{
                                                    width: 64, height: 64,
                                                    borderRadius: '50%',
                                                    background: `conic-gradient(
                                                        #10b981 0% ${succeededPercent}%, 
                                                        #ef4444 ${succeededPercent}% ${succeededPercent + failedPercent}%,
                                                        #94a3b8 ${succeededPercent + failedPercent}% 100%
                                                    )`,
                                                    boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
                                                }}
                                            />
                                            <Box sx={{
                                                position: 'absolute', top: '50%', left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: 44, height: 44, borderRadius: '50%',
                                                bgcolor: 'white', display: 'flex',
                                                flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Typography variant="body1" sx={{ fontWeight: 900, lineHeight: 1, color: '#0f172a' }}>
                                                    {total}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontSize: '0.5rem', fontWeight: 800, color: '#94a3b8' }}>BUILDS</Typography>
                                            </Box>
                                        </>
                                    );
                                })()}
                            </Box>

                            {/* Detailed Metrics */}
                            <Box sx={{ flexGrow: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.65rem' }}>Success Rate</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#10b981' }}>
                                            {((runs.filter(r => r.result === 'succeeded').length / (runs.length || 1)) * 100).toFixed(0)}%
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.65rem' }}>stable</Typography>
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.65rem' }}>Avg. Duration</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0f172a' }}>
                                            {(() => {
                                                const completed = runs.filter(r => r.finishedDate);
                                                if (completed.length === 0) return '--';
                                                const avg = completed.reduce((sum, r) => sum + (new Date(r.finishedDate!).getTime() - new Date(r.createdDate).getTime()), 0) / completed.length;
                                                return `${Math.floor(avg / 60000)}m ${Math.floor((avg % 60000) / 1000)}s`;
                                            })()}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.65rem' }}>Tests Executed</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#3b82f6' }}>
                                        {runs.reduce((sum, r) => sum + (r.testsTotal || 0), 0).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.65rem' }}>Recent Failures</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#ef4444' }}>
                                        {runs.slice(0, 10).filter(r => r.result === 'failed').length}
                                        <Typography component="span" variant="caption" sx={{ ml: 1, fontWeight: 700, color: '#94a3b8' }}>of last 10</Typography>
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Running Build Alert */}
                            {runs.some(r => r.state === 'inProgress') && (
                                <Box sx={{
                                    p: 2, borderRadius: 3, bgcolor: alpha('#3b82f6', 0.1),
                                    border: '1px solid', borderColor: alpha('#3b82f6', 0.2),
                                    display: 'flex', alignItems: 'center', gap: 2
                                }}>
                                    <CircularProgress size={20} thickness={6} />
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 900, color: '#3b82f6', display: 'block', lineHeight: 1 }}>ACTIVE AGENT</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e40af' }}>Build in progress...</Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                )}

                {/* Build History Table */}
                {runs.length > 0 ? (
                    <Paper elevation={0} sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        bgcolor: 'white'
                    }}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Workflow Status</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Build Identifier</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Orchestrator</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Test Analysis</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', py: 1.5 }}>Timeline</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', textAlign: 'right', py: 1.5 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedRuns.map((run) => (
                                        <TableRow
                                            key={run.runId}
                                            onClick={() => handleRowClick(run.runId)}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: '#f8fafc' },
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    {getStatusIcon(run.state, run.result)}
                                                    <Chip
                                                        label={run.state === 'completed' ? run.result : run.state}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(getStatusColor(run.state, run.result), 0.1),
                                                            color: getStatusColor(run.state, run.result),
                                                            fontWeight: 900,
                                                            fontSize: '0.65rem',
                                                            borderRadius: '6px',
                                                            height: 20
                                                        }}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                                    {run.buildNumber}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                                                    Run ID: #{run.runId}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                                                    {run.triggeredBy || 'System Trigger'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    {run.testsTotal ? (
                                                        <>
                                                            <Tooltip title={`${run.testsPassed} Passed, ${run.testsFailed} Failed, ${run.testsTotal - (run.testsPassed || 0) - (run.testsFailed || 0)} Other`} arrow placement="top">
                                                                <Box sx={{
                                                                    width: 28, height: 28,
                                                                    borderRadius: '50%',
                                                                    flexShrink: 0,
                                                                    background: `conic-gradient(
                                                                        #10b981 0% ${(run.testsPassed! / run.testsTotal!) * 100}%, 
                                                                        #ef4444 ${(run.testsPassed! / run.testsTotal!) * 100}% ${((run.testsPassed! + (run.testsFailed! || 0)) / run.testsTotal!) * 100}%,
                                                                        #94a3b8 ${((run.testsPassed! + (run.testsFailed! || 0)) / run.testsTotal!) * 100}% 100%
                                                                    )`,
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                                                                    cursor: 'help'
                                                                }} />
                                                            </Tooltip>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10b981' }} />
                                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#10b981' }}>{run.testsPassed}</Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ef4444' }} />
                                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#ef4444' }}>{run.testsFailed}</Typography>
                                                                </Box>
                                                            </Box>
                                                        </>
                                                    ) : (
                                                        <Typography variant="caption" sx={{ color: '#cbd5e1', fontStyle: 'italic' }}>Pending results</Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                                                    {formatDuration(run.createdDate, run.finishedDate)}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                    {new Date(run.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'right' }}>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(run.url, '_blank');
                                                    }}
                                                    sx={{
                                                        borderRadius: '8px',
                                                        bgcolor: '#0f172a',
                                                        boxShadow: 'none',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 900,
                                                        textTransform: 'none',
                                                        '&:hover': { bgcolor: '#1e293b' }
                                                    }}
                                                >
                                                    View Trace
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50]}
                            component="div"
                            count={runs.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{ borderTop: '1px solid #f1f5f9' }}
                        />
                    </Paper>
                ) : (
                    <Box sx={{
                        mt: 8, textAlign: 'center', py: 12,
                        border: '2px dashed #e2e8f0', borderRadius: 6,
                        bgcolor: 'white'
                    }}>
                        <PlayCircleOutlineIcon sx={{ fontSize: 100, color: '#e2e8f0', mb: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                            No Automation History
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#64748b', mb: 4, maxWidth: 400, mx: 'auto' }}>
                            Your repository is ready for its first execution cycle. Launch a build to begin tracking performance.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            sx={{ borderRadius: '12px', bgcolor: '#3b82f6', px: 4, fontWeight: 900 }}
                            onClick={() => window.location.hash = '#editor'} // Trigger editor view or similar
                        >
                            Orchestrate First Build
                        </Button>
                    </Box>
                )}
            </Box>

            <PipelineRunDetailsModal
                open={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                runId={selectedRunId}
                repoUrl={repoUrl}
            />
        </Box>
    );
};
