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
    LinearProgress,
    Tooltip
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';

interface RunHistory {
    status: string;
    timestamp: string;
}

interface FragileScenario {
    scenarioName: string;
    featureFile: string;
    fragilityScore: number;
    recentHistory?: RunHistory[];
}

interface FragilityIndexTableProps {
    scenarios: FragileScenario[];
}

export const FragilityIndexTable: React.FC<FragilityIndexTableProps> = ({ scenarios }) => {
    return (
        <Paper sx={{ p: 3, borderRadius: '24px', height: '100%', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <BugReportIcon />
                    </Box>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e293b' }}>Fragility Index</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Scenarios predicted most likely to fail</Typography>
                    </Box>
                </Box>
            </Box>

            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: '#94a3b8', borderBottom: '2px solid #f1f5f9', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Scenario & History</TableCell>
                            <TableCell align="right" sx={{ color: '#94a3b8', borderBottom: '2px solid #f1f5f9', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>Risk Score</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {scenarios.map((s, i) => (
                            <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                                <TableCell sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', lineHeight: 1.2 }}>{s.scenarioName}</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {s.recentHistory?.map((h, j) => (
                                                <Tooltip key={j} title={`${h.status} - ${new Date(h.timestamp).toLocaleDateString()}`}>
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '2px',
                                                            bgcolor: (h.status === 'Passed' || h.status === 'Succeeded') ? '#22c55e' : '#ef4444'
                                                        }}
                                                    />
                                                </Tooltip>
                                            ))}
                                        </Box>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem' }}>
                                            (Last {s.recentHistory?.length || 0} builds)
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="right" sx={{ py: 2, borderBottom: '1px solid #f1f5f9' }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 900, color: s.fragilityScore > 50 ? '#ef4444' : '#f59e0b' }}>
                                            {s.fragilityScore}%
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={s.fragilityScore}
                                            sx={{ width: 80, height: 6, borderRadius: 3, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: s.fragilityScore > 50 ? '#ef4444' : '#f59e0b' } }}
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
