import type { FC } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import { BranchSelector } from './BranchSelector';

interface AppHeaderProps {
    onSave: () => void;
    onSync: () => void;
    onPush: () => void;
    onReset: () => void;
    currentRepoName?: string;
    activeView: string;
    currentBranch: string;
    availableBranches: string[];
    onSwitchBranch: (branchName: string) => Promise<void>;
    onCreateBranch: (branchName: string, baseBranch: string) => Promise<void>;
}

export const AppHeader: FC<AppHeaderProps> = ({
    onSave,
    onSync,
    onPush,
    onReset,
    currentRepoName,
    activeView,
    currentBranch,
    availableBranches,
    onSwitchBranch,
    onCreateBranch
}) => {
    const isEditor = activeView === 'editor';
    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                zIndex: 1201,
                top: 0
            }}
        >
            <Toolbar sx={{ minHeight: '56px !important', position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                {/* Left Section: Placeholder or empty */}
                <Box sx={{ width: 100 }} />

                {/* Center Section: Branding & Project Context */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        pointerEvents: 'none'
                    }}
                >
                    <Typography
                        variant="h6"
                        className="brand-font"
                        sx={{
                            fontWeight: 900,
                            letterSpacing: '-1.5px',
                            color: '#0f172a',
                            fontSize: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                        }}
                    >
                        <Box component="span" sx={{ color: '#6366f1' }}>Feature</Box>Studio
                    </Typography>
                    <Box sx={{ width: '1px', height: 20, bgcolor: '#e2e8f0', mx: 1, display: { xs: 'none', sm: 'block' } }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
                            Current Project
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.8rem' }}>
                            {currentRepoName || 'Initializing...'}
                        </Typography>
                    </Box>
                </Box>

                {/* Right Section: Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Branch Selector moved here */}
                    <Box sx={{ mr: 1 }}>
                        <BranchSelector
                            variant="header"
                            currentBranch={currentBranch}
                            availableBranches={availableBranches}
                            onSwitchBranch={onSwitchBranch}
                            onCreateBranch={onCreateBranch}
                        />
                    </Box>

                    <IconButton
                        onClick={onSave}
                        disabled={!currentRepoName || !isEditor}
                        title="Quick Save (Ctrl+S)"
                        sx={{
                            bgcolor: '#f1f5f9',
                            color: '#475569',
                            '&:hover': { bgcolor: '#e2e8f0', color: '#0f172a' },
                            '&.Mui-disabled': { bgcolor: 'transparent', color: '#cbd5e1' },
                            borderRadius: '10px',
                            width: 38,
                            height: 38,
                            transition: 'all 0.2s'
                        }}
                    >
                        <SaveIcon sx={{ fontSize: 20 }} />
                    </IconButton>

                    <IconButton
                        onClick={onPush}
                        disabled={!currentRepoName || !isEditor}
                        title="Push to Azure DevOps"
                        sx={{
                            bgcolor: '#6366f1',
                            color: 'white',
                            '&:hover': { bgcolor: '#4f46e5', transform: 'translateY(-1px)' },
                            '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#cbd5e1' },
                            borderRadius: '10px',
                            width: 38,
                            height: 38,
                            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <CloudUploadIcon sx={{ fontSize: 20 }} />
                    </IconButton>

                    <Box sx={{ width: '1px', height: 24, bgcolor: '#f1f5f9', mx: 0.5 }} />

                    <IconButton
                        onClick={onSync}
                        disabled={!currentRepoName || (!isEditor && activeView !== 'pipeline')}
                        title="Sync with Remote (Pull)"
                        sx={{
                            bgcolor: 'rgba(99, 102, 241, 0.05)',
                            color: '#6366f1',
                            '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)', transform: 'translateY(-1px)' },
                            '&.Mui-disabled': { bgcolor: 'transparent', color: '#cbd5e1' },
                            borderRadius: '10px',
                            width: 38,
                            height: 38,
                            transition: 'all 0.2s'
                        }}
                    >
                        <SyncIcon sx={{ fontSize: 20 }} />
                    </IconButton>

                    <IconButton
                        onClick={onReset}
                        disabled={!currentRepoName || !isEditor}
                        title="Safely Undo or Reset"
                        sx={{
                            bgcolor: 'rgba(239, 68, 68, 0.05)',
                            color: '#ef4444',
                            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', transform: 'translateY(-1px)' },
                            '&.Mui-disabled': { bgcolor: 'transparent', color: '#cbd5e1' },
                            borderRadius: '10px',
                            width: 38,
                            height: 38,
                            transition: 'all 0.2s'
                        }}
                    >
                        <RefreshIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};
