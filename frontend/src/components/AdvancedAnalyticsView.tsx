import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    CircularProgress,
    Button,
    IconButton,
    Tooltip,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LaunchIcon from '@mui/icons-material/Launch';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { featureService } from '../services/api';

// Sub-components
import { MetricCard } from './analytics/MetricCard';
import { BuildStabilityTable } from './analytics/BuildStabilityTable';
import { BuildPerformanceTable } from './analytics/BuildPerformanceTable';
import { PerformanceHotspotsDialog } from './analytics/PerformanceHotspotsDialog';
import { DriftDetailsDialog } from './analytics/DriftDetailsDialog';
import { FeatureFilesDialog, ScenariosDialog, OutlinesDialog } from './analytics/FeatureAnalysisDialogs';
import { ThresholdDialog } from './analytics/ThresholdDialog';

interface AdvancedAnalyticsViewProps {
    repoUrl: string;
    branch?: string;
    onBack?: () => void;
    onSync?: () => Promise<void>;
    onViewChange?: (view: any) => void;
}

export const AdvancedAnalyticsView: React.FC<AdvancedAnalyticsViewProps> = ({
    repoUrl,
    branch,
    onBack,
    onSync,
    onViewChange
}) => {
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [data, setData] = useState<any>(null);

    // Dialog visibility states
    const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
    const [isFeatureFilesOpen, setIsFeatureFilesOpen] = useState(false);
    const [isScenariosOpen, setIsScenariosOpen] = useState(false);
    const [isOutlinesOpen, setIsOutlinesOpen] = useState(false);
    const [isDriftDetailsOpen, setIsDriftDetailsOpen] = useState(false);
    const [thresholdDialogData, setThresholdDialogData] = useState<any>(null);
    const [savingThreshold, setSavingThreshold] = useState(false);

    const refreshAnalytics = () => {
        setLoading(true);
        featureService.getAnalytics(repoUrl, branch)
            .then(res => {
                setData(res.data);
                setLastRefresh(new Date());
            })
            .catch(err => console.error("Failed to load analytics", err))
            .finally(() => setLoading(false));
    };

    const handleSync = async () => {
        if (!onSync) return;
        setSyncing(true);
        try {
            await onSync();
            await refreshAnalytics();
        } finally {
            setSyncing(false);
        }
    };

    const handleSaveThreshold = async () => {
        if (!thresholdDialogData) return;
        setSavingThreshold(true);
        try {
            await featureService.updateScenarioConfig(repoUrl, {
                featureFile: thresholdDialogData.featureFile,
                scenarioName: thresholdDialogData.scenarioName,
                expectedDurationMillis: thresholdDialogData.expectedDurationMillis
            });
            setThresholdDialogData(null);
            refreshAnalytics();
        } catch (err) {
            console.error("Failed to save threshold", err);
        } finally {
            setSavingThreshold(false);
        }
    };

    useEffect(() => {
        refreshAnalytics();
    }, [repoUrl, branch]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress thickness={5} size={60} sx={{ color: '#3b82f6' }} />
            </Box>
        );
    }

    if (!data) return null;

    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden', maxWidth: 1600, mx: 'auto' }}>
            {/* Header section with Stability Drift */}
            <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {onBack && (
                        <Tooltip title="Go Back">
                            <IconButton
                                size="small"
                                onClick={onBack}
                                sx={{
                                    bgcolor: '#f1f5f9',
                                    color: '#0f172a',
                                    '&:hover': { bgcolor: '#e2e8f0', transform: 'translateX(-2px)' },
                                    transition: 'all 0.2s',
                                    width: 32, height: 32
                                }}
                            >
                                <ArrowBackIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1.1 }}>
                                Analytics Hub
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.8,
                                bgcolor: 'rgba(59, 130, 246, 0.05)',
                                px: 1.2,
                                py: 0.4,
                                borderRadius: '20px',
                                border: '1px solid rgba(59, 130, 246, 0.1)'
                            }}>
                                <Box sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: syncing ? '#3b82f6' : '#22c55e',
                                    animation: syncing ? 'pulse 1.5s infinite' : 'none',
                                    '@keyframes pulse': {
                                        '0%': { opacity: 1, transform: 'scale(1)' },
                                        '50%': { opacity: 0.4, transform: 'scale(1.2)' },
                                        '100%': { opacity: 1, transform: 'scale(1)' }
                                    }
                                }} />
                                <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                                    {syncing ? 'SYNCING...' : `AUTO-SYNCED: ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </Typography>
                                <Tooltip title="Direct Sync Now">
                                    <IconButton
                                        size="small"
                                        disabled={syncing}
                                        onClick={handleSync}
                                        sx={{
                                            p: 0,
                                            ml: 0.5,
                                            color: '#3b82f6',
                                            '&:hover': { bgcolor: 'transparent', transform: 'rotate(180deg)' },
                                            transition: 'transform 0.4s'
                                        }}
                                    >
                                        <AutorenewIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>
                            Predictive insights & execution metrics
                        </Typography>
                    </Box>
                </Box>

                <Paper
                    onClick={() => setIsDriftDetailsOpen(true)}
                    sx={{
                        py: 1,
                        px: 2,
                        borderRadius: '16px',
                        bgcolor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid',
                        borderColor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        cursor: 'pointer',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                            bgcolor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        },
                        transition: 'all 0.2s'
                    }}>
                    <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        bgcolor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: data.stabilityDrift >= 0 ? '#22c55e' : '#ef4444',
                        flexShrink: 0,
                        border: data.stabilityDrift >= 0 ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <TrendingUpIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 950, color: data.stabilityDrift >= 0 ? '#16a34a' : '#dc2626', fontSize: '1rem', lineHeight: 1 }}>
                                {data.stabilityDrift > 0 ? '+' : ''}{data.stabilityDrift}%
                            </Typography>
                            <Box sx={{
                                px: 1,
                                py: 0.2,
                                fontSize: '0.6rem',
                                fontWeight: 900,
                                bgcolor: data.stabilityDrift >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: data.stabilityDrift >= 0 ? '#14532d' : '#7f1d1d',
                                borderRadius: '4px'
                            }}>
                                {data.driftStatus}
                            </Box>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.55rem', display: 'block' }}>
                            Stability Drift
                        </Typography>
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Grid container spacing={3} sx={{ flexGrow: 1.5, minHeight: 0 }}>
                    <Grid size={{ xs: 12, md: 6 }} sx={{ height: '100%' }}>
                        <BuildStabilityTable runs={data.recentRuns} />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }} sx={{ height: '100%' }}>
                        <BuildPerformanceTable runs={data.recentRuns} />
                    </Grid>
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ flexShrink: 0 }}>
                    <Paper sx={{ p: 2, borderRadius: '24px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 1.2, borderRadius: '10px', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}><AutorenewIcon /></Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Automation Efficiency</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>Project-wide ROI and reuse</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800 }}>ROI SCORE</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 950, color: '#22c55e', lineHeight: 1 }}>{data.overallStepReuseROI}%</Typography>
                                </Box>
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => onViewChange?.('step-intelligence')}
                                    sx={{ borderRadius: '8px', fontWeight: 800, textTransform: 'none', bgcolor: '#3b82f6' }}
                                >
                                    Deep Dive
                                </Button>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, p: 2, borderRadius: '16px', bgcolor: '#f8fafc' }}>
                            <MetricCard icon={DescriptionIcon} label="Features" value={data.totalFeatures} color="#3b82f6" />
                            <MetricCard icon={FormatListBulletedIcon} label="Scenarios" value={data.totalScenarios} color="#3b82f6" />
                            <MetricCard icon={QuizIcon} label="Outlines" value={data.totalScenarioOutlines} color="#8b5cf6" />
                            <MetricCard icon={LaunchIcon} label="Total Steps" value={data.totalSteps} color="#22c55e" />
                        </Box>

                        <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: '#64748b', fontStyle: 'italic', fontWeight: 600, textAlign: 'center' }}>
                            * ROI {data.overallStepReuseROI}%: For every 100 steps, {Math.round(100 - data.overallStepReuseROI)} are unique and {Math.round(data.overallStepReuseROI)} are reused.
                        </Typography>
                    </Paper>
                </Grid>
            </Box>

            {/* Dialogs */}
            {/* StepIntelligenceView replaced StepUtilizationLibrary dialog */}

            <PerformanceHotspotsDialog
                open={isPerformanceOpen}
                onClose={() => setIsPerformanceOpen(false)}
                hotspots={data.executionHotspots}
                globalAverage={data.globalAverageDurationMillis}
                onSetThreshold={(hotspot) => setThresholdDialogData(hotspot)}
            />

            <DriftDetailsDialog
                open={isDriftDetailsOpen}
                onClose={() => setIsDriftDetailsOpen(false)}
                data={data}
            />

            <FeatureFilesDialog
                open={isFeatureFilesOpen}
                onClose={() => setIsFeatureFilesOpen(false)}
                data={data.featureFiles}
            />

            <ScenariosDialog
                open={isScenariosOpen}
                onClose={() => setIsScenariosOpen(false)}
                data={data.scenarioDetails}
            />

            <OutlinesDialog
                open={isOutlinesOpen}
                onClose={() => setIsOutlinesOpen(false)}
                data={data.outlineDetails}
            />

            <ThresholdDialog
                open={Boolean(thresholdDialogData)}
                onClose={() => setThresholdDialogData(null)}
                onSave={handleSaveThreshold}
                data={thresholdDialogData}
                setData={setThresholdDialogData}
                saving={savingThreshold}
            />
        </Box>
    );
};
