import { useState } from 'react';
import type { FC } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stepper,
    Step,
    StepLabel,
    TextField,
    Box,
    Typography,
    Chip,
    Autocomplete
} from '@mui/material';
import type { CreateFeatureRequest } from '../types';

interface CreateFeatureModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (request: CreateFeatureRequest) => void;
    initialFolderPath: string;
    availableFolders: string[];
}

const steps = ['Select Folder', 'Feature Name', 'Tags', 'Create'];

export const CreateFeatureModal: FC<CreateFeatureModalProps> = ({
    open,
    onClose,
    onSubmit,
    initialFolderPath,
    availableFolders
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [folderPath, setFolderPath] = useState(initialFolderPath);
    const [featureName, setFeatureName] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            onSubmit({ folderPath, featureName, tags });
            reset();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);

    const reset = () => {
        setActiveStep(0);
        setFeatureName('');
        setTags([]);
        setTagInput('');
    };

    const handleAddTag = () => {
        if (tagInput && !tags.includes(tagInput)) {
            const formattedTag = tagInput.startsWith('@') ? tagInput : `@${tagInput}`;
            setTags([...tags, formattedTag]);
            setTagInput('');
        }
    };

    const validateName = (name: string) => {
        if (!name) return { valid: false, error: '', suggestion: '' };

        const baseName = name.toLowerCase().endsWith('.feature') ? name.slice(0, -8) : name;
        const isValid = /^[a-zA-Z0-9_]+$/.test(baseName);

        if (!isValid) {
            const suggestion = baseName.replace(/[^a-zA-Z0-9_]/g, '_') + (name.toLowerCase().endsWith('.feature') ? '.feature' : '');
            return {
                valid: false,
                error: 'File name not valid. Spaces and special characters (except _) are not allowed.',
                suggestion: suggestion
            };
        }

        return { valid: true, error: '', suggestion: '' };
    };

    const validation = validateName(featureName);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', py: 3 }}>Create New Feature File</DialogTitle>
            <DialogContent dividers sx={{ bgcolor: '#f8fafc' }}>
                <Stepper activeStep={activeStep} sx={{ py: 3, mb: 2 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel
                                StepIconProps={{
                                    sx: {
                                        '&.Mui-active': { color: '#6366f1' },
                                        '&.Mui-completed': { color: '#10b981' }
                                    }
                                }}
                            >
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>{label}</Typography>
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ mt: 2, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
                    {activeStep === 0 && (
                        <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#475569' }}>
                                Target Directory
                            </Typography>
                            <Autocomplete
                                value={folderPath}
                                onChange={(_, newValue) => setFolderPath(newValue || '/')}
                                options={availableFolders}
                                freeSolo
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="e.g. features/auth"
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            sx: { borderRadius: 3, bgcolor: 'white' }
                                        }}
                                    />
                                )}
                            />
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#94a3b8' }}>
                                Features are organized in the repository's feature folder.
                            </Typography>
                        </Box>
                    )}

                    {activeStep === 1 && (
                        <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#475569' }}>
                                File Name
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="UserLogin.feature"
                                value={featureName}
                                onChange={(e) => setFeatureName(e.target.value)}
                                error={!!validation.error}
                                helperText={validation.error || (featureName && !featureName.toLowerCase().endsWith('.feature') ? 'Note: .feature extension will be added.' : '')}
                                InputProps={{ sx: { borderRadius: 3, bgcolor: 'white' } }}
                            />
                            {validation.suggestion && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        mt: 1.5,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        bgcolor: 'rgba(99, 102, 241, 0.08)',
                                        color: '#6366f1',
                                        px: 1, py: 0.5,
                                        borderRadius: 1,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.12)' }
                                    }}
                                    onClick={() => setFeatureName(validation.suggestion)}
                                >
                                    Use Suggestion: {validation.suggestion}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {activeStep === 2 && (
                        <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#475569' }}>
                                Contextual Tags
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                <TextField
                                    fullWidth
                                    placeholder="e.g. smoke, critical"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                    InputProps={{ sx: { borderRadius: 3, bgcolor: 'white' } }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleAddTag}
                                    sx={{ borderRadius: 3, bgcolor: '#0f172a', fontWeight: 800, px: 3 }}
                                >
                                    Add
                                </Button>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1,
                                minHeight: 100,
                                p: 2,
                                border: '1px dashed #cbd5e1',
                                borderRadius: 3,
                                bgcolor: 'rgba(241, 245, 249, 0.5)'
                            }}>
                                {tags.length === 0 ? (
                                    <Typography variant="caption" sx={{ color: '#94a3b8', m: 'auto' }}>
                                        No tags added yet
                                    </Typography>
                                ) : (
                                    tags.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={tag}
                                            onDelete={() => setTags(tags.filter((t) => t !== tag))}
                                            sx={{
                                                bgcolor: 'white',
                                                fontWeight: 800,
                                                border: '1px solid #e2e8f0',
                                                color: '#6366f1'
                                            }}
                                        />
                                    ))
                                )}
                            </Box>
                        </Box>
                    )}

                    {activeStep === 3 && (
                        <Box sx={{
                            p: 3,
                            bgcolor: 'white',
                            borderRadius: 4,
                            border: '1px solid #e2e8f0',
                            textAlign: 'center'
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: '#1e293b' }}>Confirm Feature Creation</Typography>

                            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Location</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#475569' }}>{folderPath}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', pb: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Filename</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#6366f1' }}>{featureName}{featureName.toLowerCase().endsWith('.feature') ? '' : '.feature'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Applied Tags</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>{tags.length > 0 ? tags.join(' ') : 'none'}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
                <Button onClick={onClose} sx={{ color: '#64748b', fontWeight: 600 }}>Cancel</Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ fontWeight: 700 }}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={
                        (activeStep === 0 && !folderPath) ||
                        (activeStep === 1 && (!featureName || !validation.valid))
                    }
                    sx={{
                        borderRadius: 2,
                        px: 4,
                        fontWeight: 800,
                        bgcolor: '#6366f1',
                        '&:hover': { bgcolor: '#4f46e5' }
                    }}
                >
                    {activeStep === steps.length - 1 ? 'Generate Feature' : 'Continue'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
