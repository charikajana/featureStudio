import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    IconButton,
    TextField,
    InputAdornment,
    Tooltip,
    Dialog,
    Slide,
    TablePagination
} from '@mui/material';
import type { TransitionProps } from '@mui/material/transitions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import QuizIcon from '@mui/icons-material/Quiz';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface BaseDialogProps {
    open: boolean;
    onClose: () => void;
    data: any[];
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconColor: string;
    searchPlaceholder: string;
}

const GenericDeepDiveDialog: React.FC<BaseDialogProps> = ({
    open,
    onClose,
    data,
    title,
    subtitle,
    icon: Icon,
    iconColor,
    searchPlaceholder
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const rowsPerPage = 24;

    const filtered = data?.filter((item: any) =>
        (item.name || item.path || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.featureFile || '').toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <Dialog
            fullScreen
            open={open}
            onClose={onClose}
            slots={{ transition: Transition }}
            slotProps={{ paper: { sx: { bgcolor: '#f8fafc' } } }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Paper elevation={0} sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Tooltip title="Back to Analytics">
                            <IconButton onClick={onClose} sx={{ bgcolor: '#f1f5f9', color: '#0f172a', '&:hover': { bgcolor: '#e2e8f0', transform: 'translateX(-4px)' } }}>
                                <ArrowBackIcon />
                            </IconButton>
                        </Tooltip>
                        <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: `${iconColor}10`, color: iconColor }}>
                            <Icon />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px' }}>{title}</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>{subtitle} ({data?.length || 0} total)</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <TextField
                            size="small"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                            sx={{ width: 350, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#f1f5f9', '& fieldset': { borderColor: 'transparent' } } }}
                            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment>) }}
                        />
                        <IconButton onClick={onClose} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' }, borderRadius: '12px' }}><CloseIcon /></IconButton>
                    </Box>
                </Paper>

                <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
                    <Grid container spacing={2}>
                        {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item: any, idx: number) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={idx}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: '16px',
                                        border: '1px solid #e2e8f0',
                                        bgcolor: 'white',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1.5,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: iconColor,
                                            boxShadow: `0 10px 15px -3px ${iconColor}15`,
                                            transform: 'translateY(-2px)'
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ p: 0.75, borderRadius: '6px', bgcolor: `${iconColor}08`, color: iconColor }}>
                                            <Icon sx={{ fontSize: 18 }} />
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                                            {item.name || item.path?.split('/').pop()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 'auto', p: 1, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <DescriptionIcon sx={{ fontSize: 12 }} /> {item.featureFile?.split('/').pop() || item.path}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {filtered.length > rowsPerPage && (
                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                            <TablePagination
                                component="div"
                                count={filtered.length}
                                page={page}
                                onPageChange={(_, p) => setPage(p)}
                                rowsPerPage={rowsPerPage}
                                rowsPerPageOptions={[]}
                                sx={{ border: 'none' }}
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </Dialog>
    );
};

export const FeatureFilesDialog: React.FC<any> = (props) => (
    <GenericDeepDiveDialog
        {...props}
        title="Project Feature Files"
        subtitle="Feature-level specifications"
        icon={DescriptionIcon}
        iconColor="#6366f1"
        searchPlaceholder="Search feature files..."
    />
);

export const ScenariosDialog: React.FC<any> = (props) => (
    <GenericDeepDiveDialog
        {...props}
        title="Project Scenarios"
        subtitle="Individual behavioral tests"
        icon={FormatListBulletedIcon}
        iconColor="#3b82f6"
        searchPlaceholder="Search scenarios..."
    />
);

export const OutlinesDialog: React.FC<any> = (props) => (
    <GenericDeepDiveDialog
        {...props}
        title="Scenario Outlines"
        subtitle="Data-driven templates"
        icon={QuizIcon}
        iconColor="#8b5cf6"
        searchPlaceholder="Search outlines..."
    />
);
