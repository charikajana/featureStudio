import React from 'react';
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
    Tooltip,
    LinearProgress
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';

interface RunSummary {
    runId: number;
    passedCount: number;
    failedCount: number;
    skippedCount: number;
    stabilityScore: number;
    timestamp: string;
    url?: string;
}

interface BuildStabilityTableProps {
    runs: RunSummary[];
}

export const BuildStabilityTable: React.FC<BuildStabilityTableProps> = ({ runs }) => {
    // Calculate global average stability
    const avgStability = runs.length > 0
        ? runs.reduce((acc, r) => acc + (r.stabilityScore || 0), 0) / runs.length
        : 0;

    return (
        <Paper sx={{ p: 3, borderRadius: '24px', height: '100%', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        <ShieldIcon />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e293b' }}>Stability Index</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            Avg Stability: {avgStability.toFixed(1)}% (Last {runs.length} builds)
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '2px solid #f1f5f9', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Build ID</TableCell>
                            <TableCell align="center" sx={{ color: '#94a3b8', borderBottom: '2px solid #f1f5f9', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Pass/Fail</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '2px solid #f1f5f9', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Stability Score</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {runs.slice(0, 5).map((run, i) => (
                            <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                                <TableCell sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 700,
                                            color: '#3b82f6',
                                            cursor: run.url ? 'pointer' : 'default',
                                            textDecoration: run.url ? 'underline' : 'none'
                                        }}
                                        onClick={() => run.url && window.open(run.url, '_blank')}
                                    >
                                        #{run.runId}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                                        {new Date(run.timestamp).toLocaleDateString()}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center" sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                        <Tooltip title={`${run.passedCount} Passed`}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e' }} />
                                        </Tooltip>
                                        {run.failedCount > 0 && (
                                            <Tooltip title={`${run.failedCount} Failed`}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                                            </Tooltip>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 900,
                                            color: run.stabilityScore >= 90 ? '#22c55e' : run.stabilityScore >= 70 ? '#f59e0b' : '#ef4444'
                                        }}>
                                            {run.stabilityScore}%
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={run.stabilityScore}
                                            sx={{
                                                width: 60,
                                                height: 4,
                                                borderRadius: 2,
                                                bgcolor: '#f1f5f9',
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: run.stabilityScore >= 90 ? '#22c55e' : run.stabilityScore >= 70 ? '#f59e0b' : '#ef4444'
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
        </Paper>
    );
};
