import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Box } from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import LayersIcon from '@mui/icons-material/Layers';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';

import { BranchSelector } from './BranchSelector';

interface SidebarProps {
    username: string | null;
    currentBranch: string;
    availableBranches: string[];
    activeView: 'editor' | 'stats' | 'pipeline' | 'project-setup';
    onViewChange: (view: 'editor' | 'stats' | 'pipeline' | 'project-setup') => void;
    onSettingsOpen: () => void;
    onLogout: () => void;
    onRun: () => void;
    onSwitchBranch: (branchName: string) => Promise<void>;
    onCreateBranch: (branchName: string, baseBranch: string) => Promise<void>;
}

interface SidebarItem {
    id: string;
    icon: any;
    title: string;
    type: 'nav' | 'action' | 'divider' | 'special';
    view?: 'editor' | 'stats' | 'pipeline' | 'project-setup';
    action?: string;
    danger?: boolean;
}

const SidebarButton: FC<{
    icon: any;
    active?: boolean;
    onClick?: () => void;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    title: string;
    danger?: boolean;
    draggable?: boolean;
}> = ({ icon: Icon, active, onClick, title, danger, draggable, onDragStart, onDragOver, onDrop }) => (
    <Box
        onClick={onClick}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        draggable={draggable}
        title={title}
        sx={{
            width: 42,
            height: 42,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: draggable ? 'grab' : 'pointer',
            position: 'relative',
            borderRadius: '10px',
            color: active ? 'white' : 'rgba(255,255,255,0.6)',
            bgcolor: active ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
                color: danger ? '#fca5a5' : 'white',
                bgcolor: active ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)',
                transform: 'translateY(-1px)'
            },
            '&:active': {
                transform: 'scale(0.95)',
                cursor: 'grabbing'
            }
        }}
    >
        <Icon sx={{ fontSize: 24 }} />
        {active && (
            <Box sx={{
                position: 'absolute',
                left: -9,
                width: 3,
                height: 24,
                bgcolor: '#6366f1',
                borderRadius: '0 4px 4px 0',
                boxShadow: '0 0 10px rgba(99, 102, 241, 0.8)'
            }} />
        )}
    </Box>
);

export const Sidebar: FC<SidebarProps> = ({
    username,
    currentBranch,
    availableBranches,
    activeView,
    onViewChange,
    onSettingsOpen,
    onLogout,
    onRun,
    onSwitchBranch,
    onCreateBranch
}) => {
    const defaultOrder: SidebarItem[] = [
        { id: 'editor', icon: EditNoteIcon, title: 'Editor', type: 'nav', view: 'editor' },
        { id: 'project-setup', icon: FolderSpecialIcon, title: 'Project Management', type: 'nav', view: 'project-setup' },
        { id: 'divider-1', icon: null, title: '', type: 'divider' },
        { id: 'branch-selector', icon: null, title: 'Branch', type: 'special' },
        { id: 'stats', icon: CheckCircleIcon, title: 'Tests Dashboard', type: 'nav', view: 'stats' },
        { id: 'pipeline', icon: MonitorHeartIcon, title: 'Pipeline Monitor', type: 'nav', view: 'pipeline' },
        { id: 'run', icon: PlayArrowIcon, title: 'Run Pipeline', type: 'action', action: 'run' },
        { id: 'suites', icon: LayersIcon, title: 'Suites', type: 'nav' },
    ];

    const [items, setItems] = useState<SidebarItem[]>(() => {
        const saved = localStorage.getItem('sidebar-order');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Map icons back because they can't be stringified
                return parsed.map((p: any) => ({
                    ...p,
                    icon: defaultOrder.find(d => d.id === p.id)?.icon || HelpOutlineIcon
                }));
            } catch (e) {
                return defaultOrder;
            }
        }
        return defaultOrder;
    });


    useEffect(() => {
        const toSave = items.map(({ id, title, type, view, action, danger }) => ({ id, title, type, view, action, danger }));
        localStorage.setItem('sidebar-order', JSON.stringify(toSave));
    }, [items]);

    const handleDragStart = (id: string) => (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (targetId: string) => (e: React.DragEvent) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId === targetId) return;

        const newItems = [...items];
        const draggedIdx = newItems.findIndex(i => i.id === draggedId);
        const targetIdx = newItems.findIndex(i => i.id === targetId);

        if (draggedIdx !== -1 && targetIdx !== -1) {
            const [removed] = newItems.splice(draggedIdx, 1);
            newItems.splice(targetIdx, 0, removed);
            setItems(newItems);
        }
    };

    const bottomItems: SidebarItem[] = [
        { id: 'logout', icon: LogoutIcon, title: 'Logout', type: 'action', action: 'logout', danger: true },
        { id: 'settings', icon: SettingsIcon, title: 'Settings', type: 'action', action: 'settings' },
        { id: 'help', icon: HelpOutlineIcon, title: 'Help', type: 'action', action: 'help' },
    ];

    const renderItem = (item: SidebarItem) => {
        if (item.type === 'divider') {
            return (
                <Box
                    key={item.id}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop(item.id)}
                    sx={{ my: 0.5, borderBottom: '1px solid rgba(255,255,255,0.1)', width: 30, cursor: 'default' }}
                />
            );
        }

        if (item.id === 'branch-selector') {
            return (
                <Box
                    key={item.id}
                    draggable
                    onDragStart={handleDragStart(item.id)}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop(item.id)}
                    sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                    <BranchSelector
                        variant="sidebar"
                        currentBranch={currentBranch}
                        availableBranches={availableBranches}
                        onSwitchBranch={onSwitchBranch}
                        onCreateBranch={onCreateBranch}
                        onNewBranchClick={() => onViewChange('project-setup')}
                    />
                </Box>
            );
        }

        return (
            <SidebarButton
                key={item.id}
                icon={item.icon}
                title={item.title}
                danger={item.danger}
                active={item.view ? activeView === item.view : false}
                draggable
                onDragStart={handleDragStart(item.id)}
                onDragOver={handleDragOver}
                onDrop={handleDrop(item.id)}
                onClick={() => {
                    if (item.view) onViewChange(item.view);
                    if (item.action === 'run') onRun();
                    if (item.action === 'logout') onLogout();
                    if (item.action === 'settings') onSettingsOpen();
                }}
            />
        );
    };

    return (
        <Box sx={{
            width: 60,
            bgcolor: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 2,
            gap: 1,
            flexShrink: 0,
            zIndex: 1202,
            borderRight: '1px solid rgba(255,255,255,0.05)',
            userSelect: 'none'
        }}>
            {items.map(renderItem)}

            <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                {bottomItems.map(item => (
                    <SidebarButton
                        key={item.id}
                        icon={item.icon}
                        title={item.title}
                        danger={item.danger}
                        onClick={() => {
                            if (item.action === 'logout') onLogout();
                            if (item.action === 'settings') onSettingsOpen();
                        }}
                    />
                ))}

                <Box sx={{
                    mt: 1, p: 0.2,
                    borderRadius: '50%',
                    border: '2px solid rgba(99, 102, 241, 0.4)',
                    cursor: 'pointer'
                }}>
                    <AccountCircleIcon
                        sx={{ color: 'white', fontSize: 32, display: 'block' }}
                        titleAccess={username || 'User'}
                    />
                </Box>
            </Box>
        </Box>
    );
};
