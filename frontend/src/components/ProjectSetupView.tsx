import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    InputAdornment,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    CardActions,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    alpha
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import StorageIcon from '@mui/icons-material/Storage';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { featureService } from '../services/api';

interface ProjectSetupViewProps {
    onSwitchRepo: (url: string) => void;
    currentRepoUrl: string | null;
}

export const ProjectSetupView: FC<ProjectSetupViewProps> = ({
    onSwitchRepo,
    currentRepoUrl
}) => {
    const [repos, setRepos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [repoBranches, setRepoBranches] = useState<Record<string, string>>({});

    // Clone states
    const [newRepoUrl, setNewRepoUrl] = useState('');

    // Branch creation states
    const [branchDialogOpen, setBranchDialogOpen] = useState(false);
    const [selectedRepoForBranch, setSelectedRepoForBranch] = useState<string>('');
    const [availableBranches, setAvailableBranches] = useState<string[]>([]);
    const [baseBranch, setBaseBranch] = useState('');
    const [newBranchName, setNewBranchName] = useState('');
    const [creatingBranch, setCreatingBranch] = useState(false);

    // Delete states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [repoToDelete, setRepoToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchRepos();
    }, []);

    const fetchRepos = async () => {
        setLoading(true);
        try {
            const { data } = await featureService.getRepositories();
            setRepos(data);
            // Fetch current branch for each repo
            fetchCurrentBranches(data);
        } catch (e) {
            setError('Failed to load repositories');
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentBranches = async (repoList: any[]) => {
        const branchesMap: Record<string, string> = {};
        await Promise.all(repoList.map(async (repo) => {
            try {
                const { data } = await featureService.getCurrentBranch(repo.repositoryUrl);
                branchesMap[repo.repositoryUrl] = data;
                setRepoBranches(prev => ({ ...prev, [repo.repositoryUrl]: data }));
            } catch (e) {
                console.warn(`Failed to fetch branch for ${repo.repositoryUrl}`);
            }
        }));
    };

    const handleClone = async () => {
        if (!newRepoUrl) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await featureService.cloneRepo({
                repositoryUrl: newRepoUrl
            });
            setSuccess(`Successfully cloned ${newRepoUrl.split('/').pop()}`);
            setNewRepoUrl('');
            fetchRepos();
        } catch (e: any) {
            setError(e.response?.data || 'Failed to clone repository. check your PAT and URL.');
        } finally {
            setLoading(false);
        }
    };

    const [fetchingBranches, setFetchingBranches] = useState(false);

    const handleOpenBranchDialog = async (repoUrl: string) => {
        setSelectedRepoForBranch(repoUrl);
        setBranchDialogOpen(true);
        setNewBranchName('');
        setAvailableBranches([]);
        setFetchingBranches(true);

        try {
            const res = await featureService.getAllBranches(repoUrl);
            setAvailableBranches(res.data);

            let currentBranchRes = '';
            try {
                const currentRes = await featureService.getCurrentBranch(repoUrl);
                currentBranchRes = currentRes.data;
            } catch (e) {
                console.warn('Failed to fetch current branch, using fallback');
            }

            // Set base branch: either current, or first available, or 'main'
            setBaseBranch(currentBranchRes || res.data[0] || 'main');
        } catch (e) {
            setError('Failed to fetch branches. Check your connection and PAT.');
            setBranchDialogOpen(false);
        } finally {
            setFetchingBranches(false);
        }
    };

    const handleCreateBranch = async () => {
        if (!newBranchName.trim()) return;
        setCreatingBranch(true);
        try {
            const branchName = newBranchName.trim();
            await featureService.createBranch(selectedRepoForBranch, branchName, baseBranch);
            setSuccess(`Branch '${branchName}' created successfully!`);
            setBranchDialogOpen(false);

            // Fetch current branches again to update the UI
            fetchCurrentBranches(repos);

            // Optionally switch to this repo and branch if needed or just notify
            // onSwitchRepo(selectedRepoForBranch);
        } catch (e: any) {
            setError(e.response?.data || 'Failed to create branch');
        } finally {
            setCreatingBranch(false);
        }
    };

    const handleDeleteRepo = async () => {
        if (!repoToDelete) return;
        setDeleting(true);
        try {
            await featureService.deleteRepository(repoToDelete);

            // If we deleted the current active repo, clear the app state
            if (repoToDelete === currentRepoUrl) {
                onSwitchRepo('');
            }

            setSuccess('Repository removed successfully');
            setDeleteDialogOpen(false);
            setRepoToDelete(null);
            fetchRepos();
        } catch (e: any) {
            setError(e.response?.data || 'Failed to remove repository');
        } finally {
            setDeleting(false);
        }
    };

    const filteredRepos = repos.filter(repo =>
        repo.repositoryUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: 4, height: '100%', overflowY: 'auto', bgcolor: '#f8fafc' }}>
            <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                <Typography className="brand-font" variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#0f172a', letterSpacing: '-1px' }}>
                    Project & Branch Management
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, color: '#64748b', fontWeight: 500 }}>
                    Clone new projects or manage branches in existing ones.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

                <Grid container spacing={4}>
                    {/* Left Column: Clone Option */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper elevation={0} sx={{
                            p: 3,
                            borderRadius: 4,
                            border: '1px solid #e2e8f0',
                            height: '100%',
                            bgcolor: 'white',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <Box sx={{
                                    width: 48, height: 48,
                                    bgcolor: 'rgba(99, 102, 241, 0.1)',
                                    borderRadius: '16px',
                                    color: '#6366f1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <ContentCopyIcon />
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>Connect Repository</Typography>
                            </Box>

                            <Typography variant="body1" sx={{ mb: 3, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                Connect to a remote repository (GitHub or Azure DevOps) and clone it to your local workspace.
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TextField
                                    fullWidth
                                    label="Repository URL"
                                    placeholder="https://github.com/organization/repo.git"
                                    value={newRepoUrl}
                                    onChange={(e) => setNewRepoUrl(e.target.value)}
                                    InputProps={{
                                        sx: { borderRadius: 2 },
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <StorageIcon sx={{ fontSize: 20, color: '#94a3b8' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: 3, border: '1px solid #bae6fd' }}>
                                    <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700, display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Quick Tip
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#0c4a6e', fontSize: '0.8rem' }}>
                                        Ensure your Personal Access Token (PAT) is configured in Settings.
                                    </Typography>
                                </Box>

                                <Button
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={loading || !newRepoUrl}
                                    onClick={handleClone}
                                    sx={{
                                        borderRadius: '12px',
                                        py: 1.5,
                                        fontWeight: 800,
                                        bgcolor: '#6366f1',
                                        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
                                        '&:hover': { bgcolor: '#4f46e5', boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.4)' }
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Clone Repository'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Right Column: Existing Projects */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>Active Projects</Typography>
                            <TextField
                                size="small"
                                placeholder="Search repositories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    sx: { borderRadius: 2, bgcolor: 'white' },
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ width: 280 }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {filteredRepos.length > 0 ? (
                                filteredRepos.map((repo) => (
                                    <Card
                                        key={repo.repositoryUrl}
                                        elevation={0}
                                        sx={{
                                            borderRadius: 4,
                                            border: '1px solid',
                                            borderColor: currentRepoUrl === repo.repositoryUrl ? '#6366f1' : '#e2e8f0',
                                            bgcolor: 'white',
                                            overflow: 'visible',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                                                transform: 'translateY(-2px)',
                                                borderColor: currentRepoUrl === repo.repositoryUrl ? '#6366f1' : '#cbd5e1'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ px: 2.5, pb: 1, pt: 2.5, overflow: 'visible' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box sx={{
                                                        width: 44, height: 44, borderRadius: '12px',
                                                        bgcolor: repo.repositoryUrl.includes('github') ? '#f8fafc' : '#eff6ff',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        border: '1px solid',
                                                        borderColor: repo.repositoryUrl.includes('github') ? '#e2e8f0' : '#dbeafe'
                                                    }}>
                                                        {repo.repositoryUrl.includes('github') ? <GitHubIcon sx={{ fontSize: 24, color: '#0f172a' }} /> : <StorageIcon sx={{ fontSize: 24, color: '#6366f1' }} />}
                                                    </Box>
                                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.2 }}>
                                                            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, lineHeight: 1.2, color: '#1e293b' }}>
                                                                {repo.repositoryUrl.split('/').pop()?.replace('.git', '')}
                                                            </Typography>
                                                            {currentRepoUrl === repo.repositoryUrl && (
                                                                <Chip
                                                                    label="ACTIVE"
                                                                    size="small"
                                                                    sx={{
                                                                        fontWeight: 900,
                                                                        height: 20,
                                                                        fontSize: '0.6rem',
                                                                        bgcolor: '#6366f1',
                                                                        color: 'white',
                                                                        flexShrink: 0,
                                                                        '& .MuiChip-label': { px: 1, lineHeight: 1 }
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: '#64748b',
                                                                fontWeight: 500,
                                                                display: 'block',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {repo.repositoryUrl}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                        <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0, justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                px: 1.5, py: 0.5,
                                                bgcolor: '#f1f5f9',
                                                borderRadius: '30px',
                                                color: '#475569'
                                            }}>
                                                <AccountTreeIcon sx={{ fontSize: 14 }} />
                                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem' }}>
                                                    {repoBranches[repo.repositoryUrl] || '...'}
                                                </Typography>
                                            </Box>

                                            <Tooltip title="Archive new runs into local vault">
                                                <Button
                                                    size="small"
                                                    onClick={async () => {
                                                        setLoading(true);
                                                        try {
                                                            await featureService.syncVault(repo.repositoryUrl);
                                                            setSuccess(`Archival initiated for ${repo.repositoryUrl.split('/').pop()}`);
                                                        } catch (e) {
                                                            setError('Failed to initiate archival');
                                                        } finally {
                                                            setLoading(false);
                                                        }
                                                    }}
                                                    disabled={loading}
                                                    startIcon={<StorageIcon fontSize="small" />}
                                                    sx={{
                                                        borderRadius: 5,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 800,
                                                        color: '#059669',
                                                        bgcolor: alpha('#10b981', 0.05),
                                                        '&:hover': { bgcolor: alpha('#10b981', 0.1) }
                                                    }}
                                                >
                                                    Sync Vault
                                                </Button>
                                            </Tooltip>

                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                <Tooltip title="Remove Project">
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            setRepoToDelete(repo.repositoryUrl);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        sx={{
                                                            minWidth: 36,
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: '10px',
                                                            bgcolor: alpha('#ef4444', 0.05),
                                                            '&:hover': { bgcolor: alpha('#ef4444', 0.1) },
                                                            mr: 1
                                                        }}
                                                    >
                                                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                                                    </Button>
                                                </Tooltip>
                                                <Button
                                                    size="small"
                                                    onClick={() => handleOpenBranchDialog(repo.repositoryUrl)}
                                                    sx={{
                                                        color: '#6366f1',
                                                        fontWeight: 700,
                                                        textTransform: 'none',
                                                        fontSize: '0.8rem',
                                                        borderRadius: 2,
                                                        '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.05)' }
                                                    }}
                                                >
                                                    Create New Branch
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    disabled={currentRepoUrl === repo.repositoryUrl}
                                                    onClick={() => onSwitchRepo(repo.repositoryUrl)}
                                                    startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                                                    sx={{
                                                        borderRadius: '8px',
                                                        textTransform: 'none',
                                                        fontWeight: 800,
                                                        bgcolor: '#6366f1',
                                                        boxShadow: 'none',
                                                        '&:hover': { bgcolor: '#4f46e5', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)' }
                                                    }}
                                                >
                                                    {currentRepoUrl === repo.repositoryUrl ? 'Workspace Active' : 'Open'}
                                                </Button>
                                            </Box>
                                        </CardActions>
                                    </Card>
                                ))
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#f1f5f9', borderRadius: 3 }}>
                                    <Typography variant="body2" color="text.secondary">No existing projects found.</Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </Box>

            {/* Branch Creation Dialog */}
            <Dialog
                open={branchDialogOpen}
                onClose={() => setBranchDialogOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Create New Branch</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Creating branch for: <strong>{selectedRepoForBranch.split('/').pop()}</strong>
                        </Typography>

                        <FormControl fullWidth disabled={fetchingBranches}>
                            <InputLabel id="base-branch-label">Base Branch</InputLabel>
                            <Select
                                labelId="base-branch-label"
                                value={baseBranch}
                                onChange={(e) => setBaseBranch(e.target.value)}
                                label="Base Branch"
                                autoWidth={false}
                                startAdornment={fetchingBranches ? (
                                    <InputAdornment position="start">
                                        <CircularProgress size={16} color="inherit" />
                                    </InputAdornment>
                                ) : null}
                            >
                                {fetchingBranches ? (
                                    <MenuItem disabled value="">
                                        <em>Loading branches...</em>
                                    </MenuItem>
                                ) : availableBranches.length > 0 ? (
                                    availableBranches.map(b => (
                                        <MenuItem key={b} value={b}>{b}</MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled value="">
                                        <em>No branches found</em>
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="New Branch Name"
                            placeholder="feature/branch-name"
                            value={newBranchName}
                            onChange={(e) => setNewBranchName(e.target.value)}
                            autoFocus
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setBranchDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateBranch}
                        disabled={!newBranchName.trim() || creatingBranch}
                        sx={{ bgcolor: '#6366f1', fontWeight: 700, px: 3 }}
                    >
                        {creatingBranch ? <CircularProgress size={20} color="inherit" /> : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !deleting && setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 800, color: '#1e293b' }}>Remove Project?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Are you sure you want to remove <strong>{repoToDelete?.split('/').pop()?.replace('.git', '')}</strong>?
                        This will delete the local project files and its configuration. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={deleting}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteRepo}
                        disabled={deleting}
                        sx={{
                            fontWeight: 800,
                            borderRadius: 2,
                            bgcolor: '#ef4444',
                            '&:hover': { bgcolor: '#dc2626' }
                        }}
                    >
                        {deleting ? <CircularProgress size={20} color="inherit" /> : 'Remove Project'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
