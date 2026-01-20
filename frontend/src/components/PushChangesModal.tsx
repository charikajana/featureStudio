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
    TextField,
    Typography,
    Box,
    Stepper,
    Step,
    StepLabel,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import { featureService } from '../services/api';

interface PushChangesModalProps {
    open: boolean;
    onClose: () => void;
    onPush: (request: { commitMessage: string; files: string[] }) => void;
    repoUrl: string;
}

const steps = ['Select Files', 'Confirm & Push'];

export const PushChangesModal: FC<PushChangesModalProps> = ({ open, onClose, onPush, repoUrl }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<{ path: string; status: 'new' | 'modified' }[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [commitMessage, setCommitMessage] = useState('Updated feature files');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchStatus();
            setActiveStep(0);
            setSelectedFiles([]);
            setCommitMessage('Updated feature files');
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
            // Auto-select all by default
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

    const handleNext = () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one file to push.');
            return;
        }
        setActiveStep(1);
    };

    const handlePushClick = () => {
        if (!commitMessage.trim()) {
            setError('Please enter a commit message.');
            return;
        }
        onPush({ commitMessage, files: selectedFiles });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 800 }}>Push Changes</DialogTitle>
            <DialogContent dividers>
                <Stepper activeStep={activeStep} sx={{ py: 2 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ mt: 2, minHeight: 300 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                            <CircularProgress size={40} />
                        </Box>
                    ) : (
                        <>
                            {activeStep === 0 && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                                            Select files to include:
                                        </Typography>
                                        <Button size="small" onClick={handleSelectAll}>
                                            {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
                                        </Button>
                                    </Box>

                                    {files.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 8 }}>
                                            <Typography color="text.secondary">No changes detected in repository.</Typography>
                                        </Box>
                                    ) : (
                                        <Paper variant="outlined" sx={{ maxHeight: 350, overflowY: 'auto', borderRadius: 2 }}>
                                            <List dense>
                                                {files.map((file) => (
                                                    <ListItem
                                                        key={file.path}
                                                        disablePadding
                                                        secondaryAction={
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontWeight: 800,
                                                                    color: file.status === 'new' ? '#16a34a' : '#2563eb',
                                                                    bgcolor: file.status === 'new' ? '#f0fdf4' : '#eff6ff',
                                                                    px: 1, py: 0.2, borderRadius: 1, border: '1px solid',
                                                                    borderColor: file.status === 'new' ? '#bcf0da' : '#dbeafe'
                                                                }}
                                                            >
                                                                {file.status.toUpperCase()}
                                                            </Typography>
                                                        }
                                                    >
                                                        <ListItemButton onClick={() => handleToggle(file.path)}>
                                                            <ListItemIcon style={{ minWidth: 36 }}>
                                                                <Checkbox
                                                                    edge="start"
                                                                    checked={selectedFiles.indexOf(file.path) !== -1}
                                                                    tabIndex={-1}
                                                                    disableRipple
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={file.path}
                                                                primaryTypographyProps={{
                                                                    variant: 'body2',
                                                                    sx: { wordBreak: 'break-all', pr: 6 }
                                                                }}
                                                            />
                                                        </ListItemButton>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Paper>
                                    )}
                                </Box>
                            )}

                            {activeStep === 1 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                                            Commit Message
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="What changed?"
                                            multiline
                                            rows={3}
                                            value={commitMessage}
                                            onChange={(e) => setCommitMessage(e.target.value)}
                                            autoFocus
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                                            Changes Summary
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Pushing <strong>{selectedFiles.length}</strong> file(s) to branch from <strong>{repoUrl.split('/').pop()}</strong>.
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                {activeStep === 0 ? (
                    <Button
                        variant="contained"
                        onClick={handleNext}
                        disabled={files.length === 0 || loading}
                        sx={{ bgcolor: '#6366f1' }}
                    >
                        Next
                    </Button>
                ) : (
                    <>
                        <Button onClick={() => setActiveStep(0)}>Back</Button>
                        <Button
                            variant="contained"
                            onClick={handlePushClick}
                            sx={{ bgcolor: '#6366f1' }}
                        >
                            Confirm & Push
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

// Internal Paper for the list
import { Paper } from '@mui/material';
