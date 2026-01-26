import { useState, useEffect, useCallback } from 'react';
import { featureService } from '../services/api';
import type { FileNode, CreateFeatureRequest } from '../types';

export const useAppLogic = () => {
    // Always start with null to force Login Page on every app restart/refresh
    const [username, setUsername] = useState<string | null>(null);
    const [repoUrl, setRepoUrl] = useState(localStorage.getItem('repoUrl') || '');
    const [isCloned, setIsCloned] = useState(!!localStorage.getItem('repoUrl'));
    const [tree, setTree] = useState<FileNode[]>([]);
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    const [content, setContent] = useState('');
    const [currentBranch, setCurrentBranch] = useState<string>('main');
    const [availableBranches, setAvailableBranches] = useState<string[]>(['main']);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [targetFolder, setTargetFolder] = useState('/');
    const [status, setStatus] = useState({ open: false, message: '', severity: 'info' as 'info' | 'success' | 'error' });
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [activeView, setActiveView] = useState<'editor' | 'stats' | 'pipeline' | 'project-setup' | 'stability-explorer' | 'analytics' | 'engineering-insights' | 'step-intelligence' | 'risk-forecasting'>('editor');
    const [stabilityFilter, setStabilityFilter] = useState<'all' | 'flaky'>('all');
    const [runModalOpen, setRunModalOpen] = useState(false);
    const [reposLoaded, setReposLoaded] = useState(false);
    const [allRepos, setAllRepos] = useState<any[]>([]);
    const [currentRunId, setCurrentRunId] = useState<number | null>(null);
    const [runDetailsModalOpen, setRunDetailsModalOpen] = useState(false);
    const [pushModalOpen, setPushModalOpen] = useState(false);
    const [undoModalOpen, setUndoModalOpen] = useState(false);

    useEffect(() => {
        if (username) {
            if (isCloned && repoUrl) {
                refreshTree();
            } else if (!reposLoaded) {
                featureService.getRepositories().then(({ data }) => {
                    const userRepos = data.filter((repo: any) => !repo.username || repo.username === username);
                    setAllRepos(userRepos);
                    const stored = localStorage.getItem('repoUrl');
                    if (stored && userRepos.some((r: any) => r.repositoryUrl === stored)) {
                        setRepoUrl(stored);
                        setIsCloned(true);
                    } else if (userRepos.length === 0) {
                        setSettingsModalOpen(true);
                    }
                    setReposLoaded(true);
                }).catch(() => {
                    setSettingsModalOpen(true);
                    setReposLoaded(true);
                });
            }
        }
    }, [username, isCloned, repoUrl, reposLoaded]);

    const showStatus = (message: string, severity: 'info' | 'success' | 'error' = 'info') => {
        setStatus({ open: false, message, severity: 'info' }); // reset
        setTimeout(() => setStatus({ open: true, message, severity }), 10);
    };

    const refreshTree = useCallback(async () => {
        try {
            const res = await featureService.getTree(repoUrl);
            setTree(res.data);
            const { data } = await featureService.getRepositories();
            setAllRepos(data);
            try {
                const [branchRes, branchesRes] = await Promise.all([
                    featureService.getCurrentBranch(repoUrl),
                    featureService.getAllBranches(repoUrl)
                ]);
                setCurrentBranch(branchRes.data);
                setAvailableBranches(branchesRes.data);
            } catch (e) {
                console.error('Failed to get branches', e);
            }
        } catch (e) {
            showStatus('Failed to load project tree', 'error');
        }
    }, [repoUrl]);

    const loadFile = useCallback(async (path: string) => {
        setCurrentFile(path);
        try {
            const res = await featureService.getContent(repoUrl, path);
            setContent(res.data);
        } catch (e) {
            showStatus('Failed to load file', 'error');
        }
    }, [repoUrl]);

    const handleSave = useCallback(async () => {
        if (!currentFile) return;
        try {
            await featureService.saveFile(repoUrl, currentFile, content);
            showStatus('File saved locally', 'success');
            refreshTree();
        } catch (e) {
            showStatus('Failed to save file', 'error');
        }
    }, [repoUrl, currentFile, content, refreshTree]);

    const executePush = useCallback(async (request: { commitMessage: string, files: string[] }) => {
        setPushModalOpen(false);
        setLoading(true);
        try {
            const response = await featureService.pushChanges(repoUrl, request);
            setCurrentBranch(response.data);
            showStatus(`Pushed to branch: ${response.data}`, 'success');
            refreshTree();
        } catch (e: any) {
            showStatus(`Failed to push: ${e.response?.data || e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [repoUrl, refreshTree]);

    const handleSync = useCallback(async () => {
        setLoading(true);
        try {
            await featureService.syncRepo(repoUrl);
            showStatus('Project synced with remote', 'success');
            await refreshTree();
        } catch (e: any) {
            showStatus(`Failed to sync: ${e.response?.data || e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [repoUrl, refreshTree]);

    const handleSwitchBranch = useCallback(async (branchName: string) => {
        setLoading(true);
        try {
            await featureService.switchBranch(repoUrl, branchName);
            setCurrentBranch(branchName);
            showStatus(`Switched to branch: ${branchName}`, 'success');
            refreshTree();
        } catch (e: any) {
            showStatus(`Failed to switch branch: ${e.response?.data || e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [repoUrl, refreshTree]);

    const handleCreateBranch = useCallback(async (branchName: string, baseBranch: string) => {
        setLoading(true);
        try {
            const response = await featureService.createBranch(repoUrl, branchName, baseBranch);
            setCurrentBranch(response.data);
            showStatus(`Created branch: ${response.data}`, 'success');
            refreshTree();
        } catch (e: any) {
            showStatus(`Failed to create branch: ${e.response?.data || e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [repoUrl, refreshTree]);

    const handleSwitchRepo = useCallback((url: string) => {
        if (!url) {
            setRepoUrl('');
            setIsCloned(false);
            localStorage.removeItem('repoUrl');
            setTree([]);
            setCurrentFile(null);
            setContent('');
        } else {
            setRepoUrl(url);
            setIsCloned(true);
            localStorage.setItem('repoUrl', url);
            setCurrentFile(null);
            setContent('');
            if (reposLoaded) {
                featureService.getRepositories().then(({ data }) => setAllRepos(data));
            }
        }
    }, [reposLoaded]);

    const executeUndo = useCallback(async (selectedFiles: string[]) => {
        setUndoModalOpen(false);
        setLoading(true);
        try {
            await featureService.resetRepo(repoUrl, selectedFiles);
            if (selectedFiles.length === 0) {
                setCurrentFile(null);
                setContent('');
            } else if (currentFile && selectedFiles.includes(currentFile)) {
                loadFile(currentFile);
            }
            showStatus('Changes discarded successfully', 'success');
            refreshTree();
        } catch (e: any) {
            showStatus(`Failed to undo changes: ${e.response?.data || e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [repoUrl, currentFile, loadFile, refreshTree]);

    const executePipeline = useCallback(async (params: { branch: string, templateParameters: Record<string, string> }) => {
        setLoading(true);
        try {
            const { data } = await featureService.triggerPipeline({
                ...params,
                repoUrl
            });
            const runId = data?.id || data?.runId;
            if (runId) {
                setCurrentRunId(runId);
                setActiveView('pipeline');
            }
            showStatus(`Pipeline triggered successfully!`, 'success');
            setRunModalOpen(false);
        } catch (e: any) {
            showStatus(`Run failed: ${e.response?.data || e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [repoUrl]);

    const handleCreateFeature = useCallback(async (request: CreateFeatureRequest) => {
        try {
            await featureService.createFeature(repoUrl, request);
            setModalOpen(false);
            showStatus('Feature created successfully', 'success');
            refreshTree();
        } catch (e) {
            showStatus('Failed to create feature', 'error');
        }
    }, [repoUrl, refreshTree]);

    const handleLogout = () => {
        localStorage.clear();
        location.reload();
    };

    return {
        state: {
            username, repoUrl, isCloned, tree, currentFile, content,
            currentBranch, availableBranches, loading, modalOpen,
            targetFolder, status, sidebarWidth, isResizing,
            settingsModalOpen, activeView, runModalOpen, reposLoaded,
            allRepos, currentRunId, runDetailsModalOpen, pushModalOpen,
            undoModalOpen, stabilityFilter
        },
        actions: {
            setUsername, setRepoUrl, setIsCloned, setTree, setCurrentFile,
            setContent, setCurrentBranch, setAvailableBranches, setLoading,
            setModalOpen, setTargetFolder, setStatus, setSidebarWidth,
            setIsResizing, setSettingsModalOpen, setActiveView, setRunModalOpen,
            setReposLoaded, setAllRepos, setCurrentRunId, setRunDetailsModalOpen,
            setPushModalOpen, setUndoModalOpen, setStabilityFilter,
            showStatus, refreshTree, loadFile, handleSave, executePush,
            handleSwitchBranch, handleSync, handleCreateBranch, handleSwitchRepo,
            executeUndo, executePipeline, handleCreateFeature, handleLogout
        }
    };
};
