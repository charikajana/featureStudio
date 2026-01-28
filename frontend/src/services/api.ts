import axios from 'axios';
import type { FileNode, CreateFeatureRequest } from '../types';

const api = axios.create({
    baseURL: '/api',
});

// For initial development, we'll use a constant or local storage for credentials
const getAuthHeaders = () => ({
    'X-Username': localStorage.getItem('username') || 'admin'
});

export const featureService = {
    getTree: (repoUrl: string) =>
        api.get<FileNode[]>('/features/tree', {
            params: { repoUrl },
            headers: getAuthHeaders()
        }),

    getTestStats: (repoUrl: string, branch?: string) =>
        api.get<any>('/features/stats', {
            params: { repoUrl, branch },
            headers: getAuthHeaders()
        }),

    getContent: (repoUrl: string, path: string) =>
        api.get<string>('/features/content', {
            params: { repoUrl, path },
            headers: getAuthHeaders(),
            responseType: 'text' // Force text parsing
        }),

    saveFile: (repoUrl: string, path: string, content: string) =>
        api.post('/features/save', content, {
            params: { repoUrl, path },
            headers: { ...getAuthHeaders(), 'Content-Type': 'text/plain' }
        }),

    createFeature: (repoUrl: string, request: CreateFeatureRequest) =>
        api.post('/features/create', request, {
            params: { repoUrl },
            headers: getAuthHeaders()
        }),

    pushChanges: (repoUrl: string, request: { commitMessage: string, files: string[] }) =>
        api.post<string>('/features/push', request, {
            params: { repoUrl },
            headers: getAuthHeaders()
        }),

    getStatus: (repoUrl: string) =>
        api.get<{ modified: string[], untracked: string[] }>('/features/status', {
            params: { repoUrl },
            headers: getAuthHeaders()
        }),

    getSuggestions: (repoUrl: string) =>
        api.get<string[]>('/features/suggestions', {
            params: { repoUrl },
            headers: getAuthHeaders()
        }),

    getTrends: (repoUrl: string, branch: string = 'main') =>
        api.get<any[]>('/features/trends', {
            params: { repoUrl, branch },
            headers: getAuthHeaders()
        }),

    getAnalytics: (repoUrl: string, branch?: string) =>
        api.get<any>('/features/analytics', {
            params: { repoUrl, branch },
            headers: getAuthHeaders()
        }),

    updateScenarioConfig: (repoUrl: string, config: any) =>
        api.post('/features/analytics/config', config, {
            params: { repoUrl },
            headers: getAuthHeaders()
        }),

    cloneRepo: (data: any) =>
        api.post('/repositories/clone', data, {
            headers: getAuthHeaders()
        }),

    updateRepoSettings: (data: any) =>
        api.post('/repositories/settings', data, {
            headers: getAuthHeaders()
        }),

    resetRepo: (repoUrl: string, files: string[] = []) =>
        api.post('/repositories/reset', { repoUrl, files }, {
            headers: getAuthHeaders()
        }),

    syncRepo: (repoUrl: string) =>
        api.post('/repositories/sync', null, {
            params: { repoUrl },
            headers: getAuthHeaders()
        }),

    getRepositories: () =>
        api.get<any[]>('/repositories', {
            headers: getAuthHeaders()
        }),

    deleteRepository: (repoUrl: string) =>
        api.delete('/repositories', {
            params: { repoUrl },
            headers: getAuthHeaders()
        }),

    getCurrentBranch: (repoUrl: string) =>
        api.get<string>('/repositories/current-branch', {
            params: { repoUrl },
            headers: getAuthHeaders()
        }),

    getAllBranches: (repoUrl: string) =>
        api.get<string[]>('/repositories/branches', {
            params: { repoUrl },
            headers: getAuthHeaders()
        }),

    createBranch: (repoUrl: string, branchName: string, baseBranch: string) =>
        api.post<string>('/repositories/create-branch', null, {
            params: { repoUrl, branchName, baseBranch },
            headers: getAuthHeaders()
        }),

    switchBranch: (repoUrl: string, branchName: string) =>
        api.post<string>('/repositories/switch-branch', null, {
            params: { repoUrl, branchName },
            headers: getAuthHeaders()
        }),

    checkEmail: (email: string) =>
        api.post<{ exists: boolean }>('/auth/check-email', { email }),

    register: (data: any) =>
        api.post('/auth/register', data),

    login: (data: any) =>
        api.post('/auth/login', data),

    updateSettings: (data: any) =>
        api.post('/auth/settings', data, {
            headers: getAuthHeaders()
        }),

    getSettings: () =>
        api.get<any>('/auth/settings', {
            headers: getAuthHeaders()
        }),

    triggerPipeline: (params: any = {}) =>
        api.post<any>('/pipelines/trigger', params, {
            headers: getAuthHeaders()
        }),

    getPipelineRunDetails: (runId: number, repoUrl: string) =>
        api.get<any>(`/pipelines/run/${runId}`, {
            params: { repoUrl },
            headers: getAuthHeaders()
        }),

    listPipelineRuns: (repoUrl: string, limit: number = 50) =>
        api.get<any[]>('/pipelines/runs', {
            params: { repoUrl, limit },
            headers: getAuthHeaders()
        }),

    getStabilityStats: (repoUrl: string, branch?: string) =>
        api.get<any>('/pipelines/stability', {
            params: { repoUrl, branch },
            headers: getAuthHeaders()
        }),

    getStabilityExplorer: (repoUrl: string, branch?: string, page: number = 0, size: number = 20, search?: string, flakyOnly: boolean = false) =>
        api.get<any>('/pipelines/stability/explorer', {
            params: { repoUrl, branch, page, size, search, flakyOnly },
            headers: getAuthHeaders()
        }),

    syncVault: (repoUrl: string) =>
        api.post('/pipelines/stability/sync', null, {
            params: { repoUrl },
            headers: getAuthHeaders()
        })
};
