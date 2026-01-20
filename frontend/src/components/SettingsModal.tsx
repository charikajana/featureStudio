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
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Divider,
    Paper,
    Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import GitHubIcon from '@mui/icons-material/GitHub';
import StorageIcon from '@mui/icons-material/Storage';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ComputerIcon from '@mui/icons-material/Computer';
import { featureService } from '../services/api';

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
    onUpdateSuccess: () => void;
    currentRepoUrl: string | null;
    onSwitchRepo: (url: string) => void;
}

export const SettingsModal: FC<SettingsModalProps> = ({
    open,
    onClose,
    onUpdateSuccess,
    currentRepoUrl,
    onSwitchRepo
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [githubToken, setGithubToken] = useState('');
    const [azurePat, setAzurePat] = useState('');
    const [azureOrg, setAzureOrg] = useState('');
    const [azureProject, setAzureProject] = useState('');
    const [azurePipelineId, setAzurePipelineId] = useState('');
    const [repos, setRepos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newRepoUrl, setNewRepoUrl] = useState('');

    const handleNewClone = async () => {
        if (!newRepoUrl) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await featureService.cloneRepo({
                repositoryUrl: newRepoUrl,
                azureOrg,
                azureProject,
                azurePipelineId
            });
            setSuccess(`Successfully cloned ${newRepoUrl.split('/').pop()}`);
            setNewRepoUrl('');
            await fetchRepos();
            // Automatically switch to the newly cloned repo
            onSwitchRepo(newRepoUrl);
            onUpdateSuccess();
        } catch (e: any) {
            setError(e.response?.data || 'Failed to clone repository. Check your PAT and URL.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchRepos();
            fetchSettings();
        }
    }, [open]);

    const fetchSettings = async () => {
        try {
            // First fetch global user settings
            const { data: userSettings } = await featureService.getSettings();

            // If we have an active repo, fetch its specific details from our local repos list
            if (currentRepoUrl) {
                const activeRepo = repos.find(r => r.repositoryUrl === currentRepoUrl);
                if (activeRepo) {
                    setAzureOrg(activeRepo.azureOrg || '');
                    setAzureProject(activeRepo.azureProject || '');
                    setAzurePipelineId(activeRepo.azurePipelineId || '');
                } else {
                    // Fallback to user defaults if repo not in list yet
                    setAzureOrg(userSettings.azureOrg || '');
                    setAzureProject(userSettings.azureProject || '');
                    setAzurePipelineId(userSettings.azurePipelineId || '');
                }
            } else {
                // Dashboard view: show global user defaults
                setAzureOrg(userSettings.azureOrg || '');
                setAzureProject(userSettings.azureProject || '');
                setAzurePipelineId(userSettings.azurePipelineId || '');
            }
        } catch (e) {
            console.error('Failed to fetch settings', e);
        }
    };

    const fetchRepos = async () => {
        try {
            const { data } = await featureService.getRepositories();
            setRepos(data);
        } catch (e) {
            console.error('Failed to fetch repos', e);
        }
    };

    const handleUpdateSettings = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // 1. Always update global tokens
            await featureService.updateSettings({
                githubToken,
                azurePat
            });

            // 2. If we have an active project, update ITS specific settings
            if (currentRepoUrl) {
                await featureService.updateRepoSettings({
                    repositoryUrl: currentRepoUrl,
                    azureOrg,
                    azureProject,
                    azurePipelineId
                });
            } else {
                // Otherwise update user global defaults
                await featureService.updateSettings({
                    azureOrg,
                    azureProject,
                    azurePipelineId
                });
            }

            setSuccess('Settings updated successfully.');
            onUpdateSuccess();
            setGithubToken('');
            setAzurePat('');
            await fetchRepos(); // Refresh local list
        } catch (e: any) {
            setError(e.response?.data || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRepo = async (url: string) => {
        if (!window.confirm(`Are you sure you want to delete the local copy of ${url}? This cannot be undone.`)) return;

        setLoading(true);
        try {
            await featureService.deleteRepository(url);
            await fetchRepos();
            if (currentRepoUrl === url) {
                onSwitchRepo(''); // Clear current repo if deleted
            }
        } catch (e: any) {
            setError(e.response?.data || 'Failed to delete repository');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Settings</DialogTitle>

            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab icon={<VpnKeyIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Authentication" />
                <Tab icon={<StorageIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Repositories" />
            </Tabs>

            <DialogContent sx={{ minHeight: 300, mt: 2 }}>
                {activeTab === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && <Alert severity="success">{success}</Alert>}

                        {/* GitHub Section */}
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <GitHubIcon sx={{ fontSize: 20, color: '#111827' }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>GitHub Credentials</Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                Used for cloning and managing repositories hosted on GitHub.
                            </Typography>
                            <TextField
                                fullWidth
                                label="GitHub Token"
                                type="password"
                                size="small"
                                value={githubToken}
                                onChange={(e) => setGithubToken(e.target.value)}
                                placeholder="ghp_xxxxxxxxxxxx"
                                disabled={loading}
                            />
                        </Paper>

                        {/* Azure Section */}
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ComputerIcon sx={{ fontSize: 20, color: '#0078d4' }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        Azure DevOps {currentRepoUrl ? `[${currentRepoUrl.split('/').pop()?.replace('.git', '')}]` : 'Default'} Settings
                                    </Typography>
                                </Box>
                                {currentRepoUrl && <Chip label="Project Specific" size="small" color="primary" sx={{ fontSize: '10px', height: '18px' }} />}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                {currentRepoUrl
                                    ? "These settings apply ONLY to the active project."
                                    : "These are your global default settings for new clones."}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Global Azure PAT"
                                    type="password"
                                    size="small"
                                    value={azurePat}
                                    onChange={(e) => setAzurePat(e.target.value)}
                                    placeholder="Paste Azure PAT (Global)"
                                    disabled={loading}
                                />
                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                    <TextField
                                        label="Organization"
                                        size="small"
                                        value={azureOrg}
                                        onChange={(e) => setAzureOrg(e.target.value)}
                                        disabled={loading}
                                    />
                                    <TextField
                                        label="Project"
                                        size="small"
                                        value={azureProject}
                                        onChange={(e) => setAzureProject(e.target.value)}
                                        disabled={loading}
                                    />
                                </Box>
                                <TextField
                                    fullWidth
                                    label="Pipeline ID"
                                    size="small"
                                    value={azurePipelineId}
                                    onChange={(e) => setAzurePipelineId(e.target.value)}
                                    placeholder="e.g. 123"
                                    disabled={loading}
                                />
                            </Box>
                        </Paper>

                        <Button
                            variant="contained"
                            onClick={handleUpdateSettings}
                            disabled={loading}
                            fullWidth
                            size="large"
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save All Authentication Settings'}
                        </Button>
                    </Box>
                )}

                {activeTab === 1 && (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Clone New Repository</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
                            <TextField
                                fullWidth
                                label="Repository URL"
                                size="small"
                                value={newRepoUrl}
                                onChange={(e) => setNewRepoUrl(e.target.value)}
                                placeholder="https://github.com/user/repo.git"
                                disabled={loading}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleNewClone}
                                disabled={loading || !newRepoUrl}
                                sx={{ minWidth: 100, borderRadius: 1.5 }}
                            >
                                {loading ? <CircularProgress size={20} /> : 'Clone'}
                            </Button>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Active Environments</Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            You can switch between your cloned environments or remove them from local storage.
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                        {repos.length === 0 ? (
                            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc' }}>
                                <Typography variant="body2" color="text.secondary">No projects cloned yet.</Typography>
                            </Paper>
                        ) : (
                            <List sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 0 }}>
                                {repos.map((repo, idx) => (
                                    <Box key={repo.repositoryUrl}>
                                        <ListItem
                                            secondaryAction={
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        variant={currentRepoUrl === repo.repositoryUrl ? "outlined" : "contained"}
                                                        color={currentRepoUrl === repo.repositoryUrl ? "success" : "primary"}
                                                        startIcon={<OpenInNewIcon fontSize="small" />}
                                                        onClick={() => {
                                                            onSwitchRepo(repo.repositoryUrl);
                                                            onClose();
                                                        }}
                                                        disabled={currentRepoUrl === repo.repositoryUrl}
                                                    >
                                                        {currentRepoUrl === repo.repositoryUrl ? "Active" : "Switch"}
                                                    </Button>
                                                    <IconButton
                                                        edge="end"
                                                        color="error"
                                                        onClick={() => handleDeleteRepo(repo.repositoryUrl)}
                                                        disabled={loading}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            }
                                        >
                                            <ListItemText
                                                primary={repo.repositoryUrl.split('/').pop()?.replace('.git', '')}
                                                secondary={repo.repositoryUrl}
                                                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                                                secondaryTypographyProps={{ fontSize: '0.75rem', sx: { wordBreak: 'break-all' } }}
                                            />
                                        </ListItem>
                                        {idx < repos.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={loading}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};
