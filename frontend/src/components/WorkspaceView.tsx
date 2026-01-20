import type { FC } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

interface WorkspaceViewProps {
    allRepos: any[];
    onSettingsOpen: () => void;
    onSwitchRepo: (url: string) => void;
}

export const WorkspaceView: FC<WorkspaceViewProps> = ({ allRepos, onSettingsOpen, onSwitchRepo }) => {
    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 4, bgcolor: '#f1f5f9', overflowY: 'auto' }}>
            <Typography variant="h4" className="brand-font" sx={{ fontWeight: 800, mb: 0.5, color: '#0f172a', letterSpacing: '-1px' }}>
                Project Workspace
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 4, fontWeight: 500 }}>
                Select a repository to start crafting your feature files.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 3 }}>
                {/* Add New Project Card */}
                <Paper
                    elevation={0}
                    onClick={onSettingsOpen}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #cbd5e1',
                        borderRadius: 4,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        bgcolor: 'transparent',
                        '&:hover': {
                            borderColor: '#6366f1',
                            bgcolor: 'white',
                            transform: 'translateY(-4px)',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)'
                        }
                    }}
                >
                    <Box sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '18px',
                        bgcolor: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        fontSize: '32px',
                        fontWeight: 300
                    }}>+</Box>
                    <Typography className="brand-font" variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>Connect Repository</Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>GitHub or Azure DevOps</Typography>
                </Paper>

                {/* Existing Project Cards */}
                {allRepos.map((repo) => (
                    <Paper
                        key={repo.repositoryUrl}
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            border: '1px solid #e2e8f0',
                            bgcolor: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2.5,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&:hover': {
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
                                transform: 'translateY(-6px)',
                                borderColor: '#cbd5e1'
                            },
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0, left: 0, right: 0,
                                height: '4px',
                                bgcolor: repo.repositoryUrl.includes('github.com') ? '#6366f1' : '#10b981',
                                opacity: 0.8
                            }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 44, height: 44, borderRadius: 2,
                                bgcolor: repo.repositoryUrl.includes('github.com') ? '#eff6ff' : '#f0fdf4',
                                color: repo.repositoryUrl.includes('github.com') ? '#2563eb' : '#16a34a',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                border: '1px solid',
                                borderColor: repo.repositoryUrl.includes('github.com') ? '#dbeafe' : '#bcf0da'
                            }}>
                                {repo.repositoryUrl.split('/').pop()?.charAt(0).toUpperCase()}
                            </Box>
                            <Box>
                                <Typography className="brand-font" variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: '#1e293b' }}>
                                    {repo.repositoryUrl.split('/').pop()?.replace('.git', '')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>
                                    {repo.repositoryUrl.includes('github.com') ? 'GITHUB REPO' : 'AZURE DEVOPS'}
                                </Typography>
                            </Box>
                        </Box>

                        <Typography variant="body2" sx={{
                            color: '#64748b',
                            wordBreak: 'break-all',
                            fontSize: '0.8rem',
                            minHeight: '2.4em'
                        }}>
                            {repo.repositoryUrl}
                        </Typography>

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => onSwitchRepo(repo.repositoryUrl)}
                            sx={{
                                mt: 'auto',
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                bgcolor: '#6366f1'
                            }}
                        >
                            Open Project
                        </Button>
                    </Paper>
                ))}
            </Box>
        </Box>
    );
};
