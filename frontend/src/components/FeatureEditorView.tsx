import { useRef } from 'react';
import type { FC } from 'react';
import { Box, Typography, CircularProgress, Button, Tooltip } from '@mui/material';
import Editor from '@monaco-editor/react';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

interface FeatureEditorViewProps {
    currentFile: string | null;
    content: string;
    onContentChange: (value: string) => void;
    onEditorWillMount: (monaco: any) => void;
    onEditorDidMount: (editor: any) => void;
}

export const FeatureEditorView: FC<FeatureEditorViewProps> = ({
    currentFile,
    content,
    onContentChange,
    onEditorWillMount,
    onEditorDidMount
}) => {
    const editorRef = useRef<any>(null);

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
        onEditorDidMount(editor);
    };

    const handleFormat = () => {
        if (editorRef.current) {
            editorRef.current.getAction('editor.action.formatDocument').run();
        }
    };

    if (!currentFile) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flexGrow: 1,
                bgcolor: '#f8fafc',
                backgroundImage: 'radial-gradient(#e2e8f0 1.2px, transparent 1.2px)',
                backgroundSize: '24px 24px',
                p: 4
            }}>
                <Box className="animate-fade-in" sx={{ textAlign: 'center', maxWidth: 400 }}>
                    <Box sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '30px',
                        bgcolor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                        transform: 'rotate(-5deg)'
                    }}>
                        <DescriptionIcon sx={{ fontSize: 48, color: '#6366f1' }} />
                    </Box>
                    <Typography className="brand-font" variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, letterSpacing: '-0.5px' }}>
                        Open a Feature File
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontWeight: 500, lineHeight: 1.6 }}>
                        Select a file from the repository explorer on the left to start viewing or editing your BDD scenarios.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Testomat-style Header */}
            <Box sx={{
                px: 3,
                py: 2.5,
                borderBottom: '1px solid #f1f5f9',
                width: '100%',
                bgcolor: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
            }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <DescriptionIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, letterSpacing: '0.2px' }}>
                            SUITE <span style={{ color: '#0f172a', fontWeight: 600 }}>{currentFile.split('/').pop()}</span>
                        </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>
                        Edit Feature
                    </Typography>
                </Box>

                <Tooltip title="Auto-indent and align tables (Shift+Alt+F)">
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={handleFormat}
                        startIcon={<AutoFixHighIcon />}
                        sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderColor: '#e2e8f0',
                            color: '#6366f1',
                            '&:hover': {
                                bgcolor: 'rgba(99, 102, 241, 0.05)',
                                borderColor: '#6366f1'
                            }
                        }}
                    >
                        Pretty Format
                    </Button>
                </Tooltip>
            </Box>

            {/* Monaco Editor Container */}
            <Box sx={{
                flexGrow: 1,
                width: '100%',
                position: 'relative',
                bgcolor: '#ffffff',
                overflow: 'hidden'
            }}>
                <Editor
                    key={currentFile}
                    height="100%"
                    width="100%"
                    defaultLanguage="gherkin"
                    theme="gherkin-vibrant"
                    beforeMount={onEditorWillMount}
                    onMount={handleEditorDidMount}
                    value={content}
                    onChange={(v) => onContentChange(v || '')}
                    loading={<CircularProgress sx={{ m: 'auto' }} />}
                    options={{
                        fontSize: 16,
                        fontFamily: "'Cascadia Code', 'Fira Code', 'Courier New', monospace",
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        roundedSelection: true,
                        scrollBeyondLastLine: false,
                        readOnly: false,
                        automaticLayout: true,
                        cursorSmoothCaretAnimation: 'on',
                        lineHeight: 28,
                        padding: { top: 16, bottom: 16 },
                        glyphMargin: false,
                        folding: true,
                        formatOnPaste: true,
                        formatOnType: true
                    }}
                />
            </Box>
        </Box>
    );
};
