import type { FC } from 'react';
import { CreateFeatureModal } from './CreateFeatureModal';
import { SettingsModal } from './SettingsModal';
import { RunPipelineModal } from './RunPipelineModal';
import { PipelineRunDetailsModal } from './PipelineRunDetailsModal';
import { PushChangesModal } from './PushChangesModal';
import { UndoChangesModal } from './UndoChangesModal';
import type { FileNode, CreateFeatureRequest } from '../types';

interface AppModalsProps {
    modalOpen: boolean;
    setModalOpen: (val: boolean) => void;
    handleCreateFeature: (request: CreateFeatureRequest) => void;
    targetFolder: string;
    tree: FileNode[];
    settingsModalOpen: boolean;
    setSettingsModalOpen: (val: boolean) => void;
    refreshTree: () => void;
    repoUrl: string;
    handleSwitchRepo: (url: string) => void;
    runModalOpen: boolean;
    setRunModalOpen: (val: boolean) => void;
    availableBranches: string[];
    currentBranch: string;
    executePipeline: (params: any) => void;
    loading: boolean;
    runDetailsModalOpen: boolean;
    setRunDetailsModalOpen: (val: boolean) => void;
    currentRunId: number | null;
    pushModalOpen: boolean;
    setPushModalOpen: (val: boolean) => void;
    executePush: (request: any) => void;
    undoModalOpen: boolean;
    setUndoModalOpen: (val: boolean) => void;
    executeUndo: (files: string[]) => void;
}

export const AppModals: FC<AppModalsProps> = ({
    modalOpen, setModalOpen, handleCreateFeature, targetFolder, tree,
    settingsModalOpen, setSettingsModalOpen, refreshTree, repoUrl, handleSwitchRepo,
    runModalOpen, setRunModalOpen, availableBranches, currentBranch, executePipeline, loading,
    runDetailsModalOpen, setRunDetailsModalOpen, currentRunId,
    pushModalOpen, setPushModalOpen, executePush,
    undoModalOpen, setUndoModalOpen, executeUndo
}) => {
    const getAllFolders = (nodes: FileNode[]): string[] => {
        const folders: string[] = ['/'];
        const traverse = (items: FileNode[]) => {
            items.forEach(node => {
                if (node.isDirectory) {
                    folders.push(node.path);
                    if (node.children) traverse(node.children);
                }
            });
        };
        traverse(nodes || []);
        return folders;
    };

    return (
        <>
            <CreateFeatureModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleCreateFeature}
                initialFolderPath={targetFolder}
                availableFolders={getAllFolders(tree)}
            />

            <SettingsModal
                open={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                onUpdateSuccess={refreshTree}
                currentRepoUrl={repoUrl}
                onSwitchRepo={handleSwitchRepo}
            />

            <RunPipelineModal
                open={runModalOpen}
                onClose={() => setRunModalOpen(false)}
                branches={availableBranches}
                currentBranch={currentBranch}
                onRun={executePipeline}
                loading={loading}
            />

            <PipelineRunDetailsModal
                open={runDetailsModalOpen}
                onClose={() => setRunDetailsModalOpen(false)}
                runId={currentRunId}
                repoUrl={repoUrl}
            />

            <PushChangesModal
                open={pushModalOpen}
                onClose={() => setPushModalOpen(false)}
                onPush={executePush}
                repoUrl={repoUrl}
            />

            <UndoChangesModal
                open={undoModalOpen}
                onClose={() => setUndoModalOpen(false)}
                onUndo={executeUndo}
                repoUrl={repoUrl}
            />
        </>
    );
};
