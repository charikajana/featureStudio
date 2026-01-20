import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Paper
} from '@mui/material';
import { featureService } from '../services/api';
import UndoIcon from '@mui/icons-material/Undo';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

interface UndoChangesModalProps {
    open: boolean;
    onClose: () => void;
    onUndo: (files: string[]) => void;
    repoUrl: string;
}

export const UndoChangesModal: FC<UndoChangesModalProps> = ({ open, onClose, onUndo, repoUrl }) => {
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<{ path: string; status: 'new' | 'modified' }[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchStatus();
            setSelectedFiles([]);
            setError(null);
        }
    }, [open]);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const { data } = await featureService.getStatus(repoUrl);
            const allFiles: { path: string; status: 'new' | 'modified' }[] = [
                ...data.modified.map(p => ({ path: p, status: 'modified' as const })),
                ...data.untracked.map(p => ({ path: p, status: 'new' as const }))
            ];
            setFiles(allFiles);
            // Default select all for "Reset"
            setSelectedFiles(allFiles.map(f => f.path));
        } catch (e) {
            setError('Failed to fetch repository status');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (path: string) => {
        const currentIndex = selectedFiles.indexOf(path);
        const newChecked = [...selectedFiles];

        if (currentIndex === -1) {
            newChecked.push(path);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setSelectedFiles(newChecked);
        setError(null);
    };

    const handleSelectAll = () => {
        if (selectedFiles.length === files.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(files.map(f => f.path));
        }
    };

    const handleUndoClick = () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one file to undo.');
            return;
        }
        onUndo(selectedFiles);
    };

    const handleFullResetClick = () => {
        // Passing an empty array to trigger a full backend reset
        onUndo([]);
    };

    const isFullResetSelected = selectedFiles.length === files.length && files.length > 0;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                color: '#1e293b'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <UndoIcon sx={{ color: '#ef4444' }} />
                    Discard Changes
                </Box>
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleFullResetClick}
                    sx={{
                        fontWeight: 800,
                        borderWidth: 2,
                        '&:hover': { borderWidth: 2 },
                        textTransform: 'none',
                        borderRadius: 2,
                        fontSize: '0.7rem'
                    }}
                >
                    Deep Reset to Remote
                </Button>
            </DialogTitle>
            <DialogContent dividers sx={{ bgcolor: '#f8fafc' }}>
                <Box sx={{ mb: 3 }}>
                    <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2, bgcolor: 'white' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            This action cannot be undone.
                        </Typography>
                        <Typography variant="caption">
                            Selected files will be reverted to their last committed state. <strong>Deep Reset</strong> will sync the entire project with the remote server.
                        </Typography>
                    </Alert>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569' }}>
                        {files.length === 0 ? 'No Changes Found' : `Select files to discard (${selectedFiles.length}):`}
                    </Typography>
                    {files.length > 0 && (
                        <Button size="small" onClick={handleSelectAll} sx={{ fontWeight: 700 }}>
                            {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    )}
                </Box>

                <Box sx={{ minHeight: 200 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                            <CircularProgress size={32} thickness={5} sx={{ color: '#ef4444' }} />
                        </Box>
                    ) : files.length === 0 ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 6,
                            bgcolor: 'white',
                            borderRadius: 3,
                            border: '1px dashed #cbd5e1'
                        }}>
                            <DeleteSweepIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Your workspace is clean. Nothing to undo!
                            </Typography>
                        </Box>
                    ) : (
                        <Paper elevation={0} sx={{
                            maxHeight: 350,
                            overflowY: 'auto',
                            borderRadius: 3,
                            border: '1px solid #e2e8f0',
                            bgcolor: 'white'
                        }}>
                            <List dense>
                                {files.map((file) => (
                                    <ListItem
                                        key={file.path}
                                        disablePadding
                                        onClick={() => handleToggle(file.path)}
                                        sx={{
                                            borderBottom: '1px solid #f1f5f9',
                                            '&:last-child': { borderBottom: 'none' }
                                        }}
                                    >
                                        <ListItemButton sx={{ py: 1 }}>
                                            <ListItemIcon style={{ minWidth: 36 }}>
                                                <Checkbox
                                                    edge="start"
                                                    checked={selectedFiles.indexOf(file.path) !== -1}
                                                    tabIndex={-1}
                                                    disableRipple
                                                    sx={{
                                                        color: '#ef4444',
                                                        '&.Mui-checked': { color: '#ef4444' }
                                                    }}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={file.path}
                                                primaryTypographyProps={{
                                                    variant: 'body2',
                                                    sx: {
                                                        fontWeight: 500,
                                                        color: '#334155',
                                                        wordBreak: 'break-all',
                                                        pr: 6
                                                    }
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    color: file.status === 'new' ? '#16a34a' : '#2563eb',
                                                    bgcolor: file.status === 'new' ? '#f0fdf4' : '#eff6ff',
                                                    px: 1, py: 0.2, borderRadius: 1, border: '1px solid',
                                                    borderColor: file.status === 'new' ? '#bcf0da' : '#dbeafe',
                                                    position: 'absolute',
                                                    right: 16
                                                }}
                                            >
                                                {file.status.toUpperCase()}
                                            </Box>
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Box>
                {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
                <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleUndoClick}
                    disabled={selectedFiles.length === 0 || loading}
                    sx={{
                        bgcolor: '#ef4444',
                        '&:hover': { bgcolor: '#dc2626' },
                        px: 3,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 2,
                        boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
                    }}
                >
                    {isFullResetSelected ? 'Discard All Changes' : `Discard ${selectedFiles.length} Changes`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
