import React from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    InputAdornment,
    CircularProgress
} from '@mui/material';

interface ThresholdDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
    data: any;
    setData: (data: any) => void;
    saving: boolean;
}

export const ThresholdDialog: React.FC<ThresholdDialogProps> = ({
    open,
    onClose,
    onSave,
    data,
    setData,
    saving
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 800 }}>Set Expected Duration</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Expected time for <strong>{data?.scenarioName}</strong>.
                        If average execution exceeds this, it will be flagged as a hotspot.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Duration (Seconds)"
                        type="number"
                        value={data ? data.expectedDurationMillis / 1000 : 0}
                        onChange={(e) => setData({ ...data, expectedDurationMillis: parseFloat(e.target.value) * 1000 })}
                        InputProps={{ endAdornment: <InputAdornment position="end">s</InputAdornment> }}
                        autoFocus
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} disabled={saving}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={onSave}
                    disabled={saving}
                    sx={{ bgcolor: '#3b82f6', fontWeight: 800 }}
                >
                    {saving ? <CircularProgress size={20} color="inherit" /> : 'Save Duration'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
