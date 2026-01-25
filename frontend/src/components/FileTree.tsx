import { useState } from 'react';
import type { FC, MouseEvent } from 'react';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    IconButton,
    Typography,
    Box,
    alpha
} from '@mui/material';
import type { Theme } from '@mui/material';
import {
    Folder,
    Description,
    ExpandLess,
    ExpandMore,
    Add,
    Sync as SyncIcon
} from '@mui/icons-material';
import type { FileNode } from '../types';

interface FileTreeProps {
    nodes: FileNode[];
    onSelect: (path: string) => void;
    onSync?: () => void;
    onNewFile: (folderPath: string) => void;
    repoName?: string;
}

// Custom Cucumber Icon (Matching Official Branding)
const CucumberIcon = () => (
    <svg width="18" height="18" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <path d="M128 0C57.307 0 0 57.307 0 128c0 70.693 57.307 128 128 128 15.547 0 30.413-2.773 44.12-7.853L128 256h85.333c23.507 0 42.667-19.16 42.667-42.667v-85.333c0-70.693-57.307-128-128-128z" fill="#00a818" />
        <ellipse cx="128" cy="81.067" rx="17.067" ry="25.6" fill="#fff" transform="rotate(0 128 81.067)" />
        <ellipse cx="166.4" cy="102.4" rx="17.067" ry="25.6" fill="#fff" transform="rotate(45 166.4 102.4)" />
        <ellipse cx="179.2" cy="145.067" rx="17.067" ry="25.6" fill="#fff" transform="rotate(90 179.2 145.067)" />
        <ellipse cx="153.6" cy="183.467" rx="17.067" ry="25.6" fill="#fff" transform="rotate(135 153.6 183.467)" />
        <ellipse cx="102.4" cy="183.467" rx="17.067" ry="25.6" fill="#fff" transform="rotate(225 102.4 183.467)" />
        <ellipse cx="76.8" cy="145.067" rx="17.067" ry="25.6" fill="#fff" transform="rotate(270 76.8 145.067)" />
        <ellipse cx="89.6" cy="102.4" rx="17.067" ry="25.6" fill="#fff" transform="rotate(315 89.6 102.4)" />
    </svg>
);

const FileTreeItem: FC<{
    node: FileNode;
    onSelect: (path: string) => void;
    onNewFile: (folderPath: string) => void;
    depth: number;
}> = ({ node, onSelect, onNewFile, depth }) => {
    const [open, setOpen] = useState(true);

    const handleClick = () => {
        if (node.isDirectory) {
            setOpen(!open);
        } else {
            onSelect(node.path);
        }
    };

    return (
        <>
            <ListItem
                disablePadding
                secondaryAction={
                    node.isDirectory ? (
                        <IconButton edge="end" size="small" onClick={(e: MouseEvent) => {
                            e.stopPropagation();
                            onNewFile(node.path);
                        }}>
                            <Add fontSize="small" />
                        </IconButton>
                    ) : null
                }
                sx={{
                    '&:hover .MuiListItemSecondaryAction-root': { opacity: 1 },
                    '& .MuiListItemSecondaryAction-root': { opacity: 0, transition: 'opacity 0.2s' }
                }}
            >
                <ListItemButton
                    onClick={handleClick}
                    sx={{
                        pl: depth * 2 + 2,
                        py: 0.5,
                        borderRadius: 1,
                        mx: 1,
                        '&:hover': { backgroundColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.08) }
                    }}
                >
                    <ListItemIcon style={{ minWidth: 32 }}>
                        {node.isDirectory ? (
                            <Folder fontSize="small" sx={{ color: 'primary.main' }} />
                        ) : (
                            node.name.endsWith('.feature') ? <CucumberIcon /> : <Description fontSize="small" color="action" />
                        )}
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, width: '100%' }}>
                                <Typography
                                    variant="body2"
                                    noWrap
                                    sx={{
                                        fontWeight: node.isDirectory ? 600 : 400,
                                        fontSize: '0.85rem',
                                        flexShrink: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    {node.name}
                                </Typography>
                                {node.status === 'new' && (
                                    <Box
                                        sx={{
                                            color: '#16a34a',
                                            fontWeight: 800,
                                            fontSize: '0.6rem',
                                            bgcolor: '#f0fdf4',
                                            px: 0.6,
                                            py: 0.1,
                                            borderRadius: '4px',
                                            border: '1px solid #bcf0da',
                                            flexShrink: 0,
                                            lineHeight: 1
                                        }}
                                    >
                                        NEW
                                    </Box>
                                )}
                                {node.status === 'modified' && (
                                    <Box
                                        sx={{
                                            color: '#2563eb',
                                            fontWeight: 800,
                                            fontSize: '0.6rem',
                                            bgcolor: '#eff6ff',
                                            px: 0.6,
                                            py: 0.1,
                                            borderRadius: '4px',
                                            border: '1px solid #dbeafe',
                                            flexShrink: 0,
                                            lineHeight: 1
                                        }}
                                    >
                                        MOD
                                    </Box>
                                )}
                            </Box>
                        }
                    />
                    {node.isDirectory ? (open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />) : null}
                </ListItemButton>
            </ListItem>
            {node.isDirectory && node.children && (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {node.children.map((child) => (
                            <FileTreeItem
                                key={child.path}
                                node={child}
                                onSelect={onSelect}
                                onNewFile={onNewFile}
                                depth={depth + 1}
                            />
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};

export const FileTree: FC<FileTreeProps> = ({ nodes, onSelect, onSync, onNewFile, repoName }) => {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default'
            }}
        >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: '#e2e8f0', bgcolor: '#f1f5f9' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <div style={{ width: 3, height: 16, backgroundColor: '#6366f1', borderRadius: 4 }} />
                        <Typography variant="subtitle2" className="brand-font" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', letterSpacing: '-0.3px' }}>
                            PROJECT EXPLORER
                        </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.6rem', ml: 1.5, letterSpacing: '0.5px' }}>
                        {repoName?.toUpperCase() || 'NOT CONNECTED'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {onSync && (
                        <IconButton
                            size="small"
                            onClick={onSync}
                            title="Sync with Remote (Pull)"
                            sx={{
                                bgcolor: 'white',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                '&:hover': { bgcolor: '#f8fafc' }
                            }}
                        >
                            <SyncIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                        </IconButton>
                    )}
                    <IconButton
                        size="small"
                        onClick={() => onNewFile('/')}
                        sx={{
                            bgcolor: 'white',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            '&:hover': { bgcolor: '#f8fafc' }
                        }}
                    >
                        <Add sx={{ fontSize: 16, color: '#6366f1' }} />
                    </IconButton>
                </Box>
            </Box>
            <List dense sx={{ overflowY: 'auto', flexGrow: 1, py: 1 }}>
                {nodes.map((node) => (
                    <FileTreeItem
                        key={node.path}
                        node={node}
                        onSelect={onSelect}
                        onNewFile={onNewFile}
                        depth={0}
                    />
                ))}
            </List>
        </Box>
    );
};
