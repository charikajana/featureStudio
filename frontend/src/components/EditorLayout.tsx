import { useCallback } from 'react';
import type { FC } from 'react';
import { Box, Typography } from '@mui/material';
import { FileTree } from './FileTree';
import { FeatureEditorView } from './FeatureEditorView';
import type { FileNode } from '../types';
import { registerGherkinLanguage } from '../config/editorConfig';

interface EditorLayoutProps {
    sidebarWidth: number;
    setIsResizing: (val: boolean) => void;
    tree: FileNode[];
    loadFile: (path: string) => void;
    setTargetFolder: (path: string) => void;
    setModalOpen: (val: boolean) => void;
    activeRepoName: string;
    currentFile: string | null;
    content: string;
    setContent: (val: string) => void;
    currentBranch: string;
    onSync: () => void;
}

export const EditorLayout: FC<EditorLayoutProps> = ({
    sidebarWidth, setIsResizing, tree, loadFile,
    setTargetFolder, setModalOpen, activeRepoName,
    currentFile, content, setContent, currentBranch, onSync
}) => {
    const handleEditorDidMount = useCallback((editor: any) => {
        editor.layout();
    }, []);

    return (
        <>
            <Box
                sx={{
                    width: sidebarWidth,
                    borderRight: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                    bgcolor: '#f9fafb'
                }}
            >
                <FileTree
                    nodes={tree}
                    onSelect={loadFile}
                    onSync={onSync}
                    onNewFile={(path) => { setTargetFolder(path); setModalOpen(true); }}
                    repoName={activeRepoName}
                />
                <Box
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                    }}
                    sx={{
                        position: 'absolute',
                        left: 60 + sidebarWidth,
                        top: 56,
                        bottom: 0,
                        width: '4px',
                        cursor: 'col-resize',
                        '&:hover': { bgcolor: '#6366f1' },
                        zIndex: 10
                    }}
                />
            </Box>

            <Box component="main" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', bgcolor: '#ffffff', overflow: 'hidden' }}>
                {/* Breadcrumbs Bar */}
                <Box sx={{
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    gap: 1
                }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Files</Typography>
                    <Typography variant="caption" sx={{ color: '#cbd5e1' }}>/</Typography>
                    {currentFile?.split('/').map((part, i, arr) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: i === arr.length - 1 ? '#4338ca' : '#64748b',
                                    fontWeight: i === arr.length - 1 ? 700 : 500
                                }}
                            >
                                {part}
                            </Typography>
                            {i < arr.length - 1 && <Typography variant="caption" sx={{ color: '#cbd5e1' }}>/</Typography>}
                        </Box>
                    ))}
                </Box>

                <FeatureEditorView
                    currentFile={currentFile}
                    content={content}
                    onContentChange={setContent}
                    onEditorWillMount={registerGherkinLanguage}
                    onEditorDidMount={handleEditorDidMount}
                />

                {/* Editor Status Bar */}
                <Box sx={{
                    height: 24,
                    bgcolor: '#6366f1',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box component="span" sx={{ opacity: 0.7 }}>BRANCH:</Box> {currentBranch || '...'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box component="span" sx={{ opacity: 0.7 }}>SYNC:</Box> OK
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.9 }}>
                        FEATURE STUDIO v1.2
                    </Typography>
                </Box>
            </Box>
        </>
    );
};
