import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Paper,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

interface RunPipelineModalProps {
    open: boolean;
    onClose: () => void;
    branches: string[];
    currentBranch: string;
    onRun: (params: { branch: string, templateParameters: Record<string, string> }) => void;
    loading: boolean;
}

export const RunPipelineModal: FC<RunPipelineModalProps> = ({
    open,
    onClose,
    branches,
    currentBranch,
    onRun,
    loading
}) => {
    const [selectedBranch, setSelectedBranch] = useState(currentBranch || 'main');
    const [paramKey, setParamKey] = useState('');
    const [paramValue, setParamValue] = useState('');
    // Default parameters matching your azure-pipelines.yml parameter names
    const [parameters, setParameters] = useState<Record<string, string>>({
        Env: 'STAGING',
        Browser: 'chromium',
        Tags: 'login',
        PoolName: 'Azure Pipelines',
        EmailRecipients: 'test@example.com'
    });

    useEffect(() => {
        if (currentBranch) setSelectedBranch(currentBranch);
    }, [currentBranch]);

    const handleAddParam = () => {
        if (!paramKey) return;
        setParameters(prev => ({ ...prev, [paramKey]: paramValue }));
        setParamKey('');
        setParamValue('');
    };

    const handleRemoveParam = (key: string) => {
        const newParams = { ...parameters };
        delete newParams[key];
        setParameters(newParams);
    };

    const handleRun = () => {
        onRun({
            branch: selectedBranch,
            templateParameters: parameters
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
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
                    width: 44, h: 44,
                    borderRadius: '12px',
                    bgcolor: '#3b82f6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                    <RocketLaunchIcon sx={{ fontSize: 24 }} />
                </Box>
                Launch Pipeline
            </DialogTitle>

            <DialogContent sx={{ mt: 3, pb: 2, px: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Branch Selection */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#475569', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                            Execution Context
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel sx={{ fontWeight: 600 }}>Target Branch</InputLabel>
                            <Select
                                value={selectedBranch}
                                label="Target Branch"
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                disabled={loading}
                                sx={{ borderRadius: 3, bgcolor: '#f1f5f9', '& fieldset': { border: 'none' } }}
                            >
                                {branches.map(b => (
                                    <MenuItem key={b} value={b} sx={{ fontWeight: 600 }}>{b}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#94a3b8', fontWeight: 500 }}>
                            Build will be triggered using code from the selected branch.
                        </Typography>
                    </Box>

                    {/* Parameters Section */}
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                Runtime Parameters
                            </Typography>
                            <Chip label={`${Object.keys(parameters).length} Configured`} size="small" sx={{ fontWeight: 800, height: 20, fontSize: '0.6rem', bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }} />
                        </Box>

                        <Paper elevation={0} sx={{
                            p: 2,
                            bgcolor: '#f8fafc',
                            borderRadius: 3,
                            border: '1px solid #e2e8f0'
                        }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: parameters && Object.keys(parameters).length > 0 ? 2 : 0 }}>
                                {Object.entries(parameters).map(([key, val]) => (
                                    <Chip
                                        key={key}
                                        label={`${key}: ${val}`}
                                        onDelete={() => handleRemoveParam(key)}
                                        size="small"
                                        sx={{
                                            bgcolor: 'white',
                                            fontWeight: 700,
                                            border: '1px solid #e2e8f0',
                                            color: '#1e293b',
                                            fontSize: '0.75rem',
                                            '& .MuiChip-deleteIcon': { color: '#ef4444' }
                                        }}
                                    />
                                ))}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="Param Key"
                                    value={paramKey}
                                    onChange={(e) => setParamKey(e.target.value)}
                                    sx={{
                                        flex: 1,
                                        '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' }
                                    }}
                                    disabled={loading}
                                />
                                <TextField
                                    size="small"
                                    placeholder="Value"
                                    value={paramValue}
                                    onChange={(e) => setParamValue(e.target.value)}
                                    sx={{
                                        flex: 1,
                                        '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'white' }
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddParam()}
                                    disabled={loading}
                                />
                                <IconButton
                                    size="small"
                                    onClick={handleAddParam}
                                    disabled={!paramKey || loading}
                                    sx={{
                                        bgcolor: '#0f172a',
                                        color: 'white',
                                        borderRadius: 2,
                                        '&:hover': { bgcolor: '#1e293b' },
                                        '&.Mui-disabled': { bgcolor: '#e2e8f0' }
                                    }}
                                >
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Button onClick={onClose} disabled={loading} sx={{ fontWeight: 700, color: '#64748b' }}>
                    Cancel
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="contained"
                    onClick={handleRun}
                    disabled={loading}
                    sx={{
                        borderRadius: '12px',
                        px: 4,
                        py: 1,
                        fontWeight: 900,
                        bgcolor: '#3b82f6',
                        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
                        '&:hover': { bgcolor: '#2563eb', boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.4)' }
                    }}
                    startIcon={!loading && <RocketLaunchIcon fontSize="small" />}
                >
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Launch Build'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
