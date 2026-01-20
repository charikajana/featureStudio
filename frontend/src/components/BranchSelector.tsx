import React, { useState } from 'react';
import type { FC } from 'react';
import {
    Box,
    Typography,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';

interface BranchSelectorProps {
    currentBranch: string;
    availableBranches: string[];
    onSwitchBranch: (branchName: string) => Promise<void>;
    onCreateBranch: (branchName: string, baseBranch: string) => Promise<void>;
    onNewBranchClick?: () => void;
    variant?: 'header' | 'sidebar';
}

export const BranchSelector: FC<BranchSelectorProps> = ({
    currentBranch,
    availableBranches,
    onSwitchBranch,
    onCreateBranch,
    onNewBranchClick,
    variant = 'header'
}) => {
    const [branchMenuAnchor, setBranchMenuAnchor] = useState<null | HTMLElement>(null);
    const [branchDialogOpen, setBranchDialogOpen] = useState(false);
    const [baseBranch, setBaseBranch] = useState(currentBranch);
    const [newBranchName, setNewBranchName] = useState('');

    const handleBranchClick = (event: React.MouseEvent<any>) => {
        setBranchMenuAnchor(event.currentTarget);
    };

    const handleBranchMenuClose = () => {
        setBranchMenuAnchor(null);
    };

    const handleSwitchBranch = async (branchName: string) => {
        handleBranchMenuClose();
        await onSwitchBranch(branchName);
    };

    const handleNewBranchClick = () => {
        handleBranchMenuClose();
        if (onNewBranchClick) {
            onNewBranchClick();
        } else {
            setBranchDialogOpen(true);
            setNewBranchName('');
            setBaseBranch(currentBranch);
        }
    };

    const handleCreateBranch = async () => {
        if (!newBranchName.trim()) return;

        await onCreateBranch(newBranchName.trim(), baseBranch);
        setBranchDialogOpen(false);
        setNewBranchName('');
    };

    return (
        <>
            {/* Branch Indicator with Dropdown */}
            {variant === 'header' ? (
                <Box
                    onClick={handleBranchClick}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 0.5,
                        bgcolor: '#f1f5f9',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#e2e8f0' }
                    }}
                >
                    <AccountTreeIcon sx={{ fontSize: 16, color: '#64748b' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                        {currentBranch}
                    </Typography>
                    <ArrowDropDownIcon sx={{ fontSize: 18, color: '#64748b' }} />
                </Box>
            ) : (
                <AccountTreeIcon
                    onClick={handleBranchClick}
                    sx={{
                        color: 'white',
                        fontSize: 24,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 }
                    }}
                    titleAccess={`Branch: ${currentBranch}`}
                />
            )}

            {/* Branch Menu */}
            <Menu
                anchorEl={branchMenuAnchor}
                open={Boolean(branchMenuAnchor)}
                onClose={handleBranchMenuClose}
            >
                <MenuItem onClick={handleNewBranchClick}>
                    <AddIcon sx={{ mr: 1, fontSize: 18 }} />
                    New Branch...
                </MenuItem>
                <MenuItem disabled sx={{ opacity: 0.6, fontSize: '0.75rem' }}>
                    SWITCH TO:
                </MenuItem>
                {availableBranches.map((branch) => (
                    <MenuItem
                        key={branch}
                        onClick={() => handleSwitchBranch(branch)}
                        selected={branch === currentBranch}
                    >
                        {branch === currentBranch && '✓ '}
                        {branch}
                    </MenuItem>
                ))}
            </Menu>

            {/* Branch Creation Dialog */}
            <Dialog open={branchDialogOpen} onClose={() => setBranchDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Branch</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Base Branch</InputLabel>
                            <Select
                                value={baseBranch}
                                onChange={(e) => setBaseBranch(e.target.value)}
                                label="Base Branch"
                            >
                                {availableBranches.map((branch) => (
                                    <MenuItem key={branch} value={branch}>{branch}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="New Branch Name"
                            value={newBranchName}
                            onChange={(e) => setNewBranchName(e.target.value)}
                            placeholder="feature/my-new-feature"
                            autoFocus
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBranchDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateBranch}
                        disabled={!newBranchName.trim()}
                    >
                        Create Branch
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
