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
    Tooltip
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
                                    <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center' }}>
                                        <Tooltip title={`${run.passedCount} Passed`} arrow>
                                            <Box sx={{
                                                width: 10,
                                                height: 10,
                                                borderRadius: '50%',
                                                bgcolor: '#10b981',
                                                boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
                                                border: '2px solid white'
                                            }} />
                                        </Tooltip>
                                        {run.failedCount > 0 && (
                                            <Tooltip title={`${run.failedCount} Failed`} arrow>
                                                <Box sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor: '#ef4444',
                                                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
                                                    border: '2px solid white'
                                                }} />
                                            </Tooltip>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75 }}>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 950,
                                            fontSize: '0.9rem',
                                            color: run.stabilityScore >= 90 ? '#10b981' : run.stabilityScore >= 70 ? '#f59e0b' : '#ef4444'
                                        }}>
                                            {run.stabilityScore}%
                                        </Typography>
                                        <Box sx={{ width: 80, height: 6, bgcolor: '#f1f5f9', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                                            <Box sx={{
                                                width: `${run.stabilityScore}%`,
                                                height: '100%',
                                                borderRadius: 3,
                                                background: run.stabilityScore >= 90
                                                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                                                    : run.stabilityScore >= 70
                                                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }} />
                                        </Box>
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
