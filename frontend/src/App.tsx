import { useEffect } from 'react';
import {
  Box,
  CssBaseline,
  CircularProgress,
  Snackbar,
  Alert,
  Typography
} from '@mui/material';
import { AppHeader } from './components/AppHeader';
import { Sidebar } from './components/Sidebar';
import { TestStatsView } from './components/TestStatsView';
import { PipelineExecutionView } from './components/PipelineExecutionView';
import { ProjectSetupView } from './components/ProjectSetupView';
import { StabilityExplorerView } from './components/StabilityExplorerView';
import { Login } from './components/Login';
import { useAppLogic } from './hooks/useAppLogic';
import { WorkspaceView } from './components/WorkspaceView';
import { EditorLayout } from './components/EditorLayout';
import { AppModals } from './components/AppModals';
import { AdvancedAnalyticsView } from './components/AdvancedAnalyticsView';
import { EngineeringInsightsView } from './components/EngineeringInsightsView';
import { StepIntelligenceView } from './components/StepIntelligenceView';
import { RiskForecastingView } from './components/RiskForecastingView';

const MIN_SIDEBAR_WIDTH = 250;
const MAX_SIDEBAR_WIDTH = 600;

function App() {
  const { state, actions } = useAppLogic();
  const {
    username, repoUrl, isCloned, tree, currentFile, content,
    currentBranch, availableBranches, loading, modalOpen, runModalOpen,
    targetFolder, status, sidebarWidth, isResizing,
    settingsModalOpen, activeView,
    allRepos, currentRunId, runDetailsModalOpen, pushModalOpen,
    undoModalOpen, stabilityFilter
  } = state;

  const {
    setUsername, setModalOpen, setTargetFolder, setStatus, setSidebarWidth,
    setIsResizing, setSettingsModalOpen, setActiveView, setRunModalOpen,
    setRunDetailsModalOpen, setPushModalOpen, setUndoModalOpen,
    setStabilityFilter,
    refreshTree, loadFile, handleSave, handleSync, executePush,
    handleSwitchBranch, handleCreateBranch, handleSwitchRepo,
    executeUndo, executePipeline, handleCreateFeature, handleLogout
  } = actions;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setSidebarWidth, setIsResizing]);

  // Auto-refresh tree when switching to editor view
  useEffect(() => {
    if (activeView === 'editor' && isCloned && repoUrl) {
      refreshTree();
    }
  }, [activeView, isCloned, repoUrl, refreshTree]);

  if (!username) {
    return <Login onLoginSuccess={(email) => {
      localStorage.setItem('username', email);
      setUsername(email);
    }} />;
  }

  const activeRepoName = repoUrl ? repoUrl.split('/').pop()?.replace('.git', '') || '' : '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: '#f8f9fa' }}>
      <CssBaseline />
      <AppHeader
        onSave={handleSave}
        onSync={handleSync}
        onPush={() => setPushModalOpen(true)}
        onReset={() => setUndoModalOpen(true)}
        currentRepoName={activeRepoName}
        activeView={activeView}
        currentBranch={currentBranch}
        availableBranches={availableBranches}
        onSwitchBranch={handleSwitchBranch}
        onCreateBranch={handleCreateBranch}
      />

      <Box sx={{ display: 'flex', flex: 1, width: '100%', overflow: 'hidden', position: 'relative' }}>
        <Sidebar
          username={username}
          onLogout={handleLogout}
          onRun={() => setRunModalOpen(true)}
          onSettingsOpen={() => setSettingsModalOpen(true)}
          activeView={activeView}
          onViewChange={setActiveView}
        />

        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          {activeView === 'editor' ? (
            <>
              {isCloned ? (
                <EditorLayout
                  sidebarWidth={sidebarWidth}
                  setIsResizing={setIsResizing}
                  tree={tree}
                  loadFile={loadFile}
                  setTargetFolder={setTargetFolder}
                  setModalOpen={setModalOpen}
                  activeRepoName={activeRepoName}
                  currentFile={currentFile}
                  content={content}
                  setContent={actions.setContent}
                  onSync={handleSync}
                  currentBranch={currentBranch}
                />
              ) : (
                <WorkspaceView
                  allRepos={allRepos}
                  onSettingsOpen={() => setSettingsModalOpen(true)}
                  onSwitchRepo={handleSwitchRepo}
                />
              )}
            </>
          ) : activeView === 'stats' ? (
            <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: '#f3f4f6' }}>
              <TestStatsView
                repoUrl={repoUrl}
                branch={currentBranch}
                onViewAllScenarios={(filter: "all" | "flaky" | undefined) => {
                  setStabilityFilter(filter || 'all');
                  setActiveView('stability-explorer');
                }}
              />
            </Box>
          ) : activeView === 'stability-explorer' ? (
            <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: '#f3f4f6' }}>
              <StabilityExplorerView
                repoUrl={repoUrl}
                onBack={() => setActiveView('stats')}
                initialFilter={stabilityFilter}
                onSync={handleSync}
              />
            </Box>
          ) : activeView === 'pipeline' ? (
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <PipelineExecutionView repoUrl={repoUrl} runId={currentRunId} />
            </Box>
          ) : activeView === 'project-setup' ? (
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <ProjectSetupView
                currentRepoUrl={repoUrl}
                onSwitchRepo={(url) => {
                  handleSwitchRepo(url);
                  setActiveView('editor');
                }}
              />
            </Box>
          ) : activeView === 'analytics' ? (
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <AdvancedAnalyticsView
                repoUrl={repoUrl}
                branch={currentBranch}
                onBack={() => setActiveView('editor')}
                onSync={handleSync}
                onViewChange={setActiveView}
              />
            </Box>
          ) : activeView === 'engineering-insights' ? (
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <EngineeringInsightsView
                repoUrl={repoUrl}
                branch={currentBranch}
                onBack={() => setActiveView('analytics')}
                onSync={handleSync}
                onViewChange={setActiveView}
              />
            </Box>
          ) : activeView === 'step-intelligence' ? (
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <StepIntelligenceView
                repoUrl={repoUrl}
                branch={currentBranch}
                onBack={() => setActiveView('analytics')}
              />
            </Box>
          ) : activeView === 'risk-forecasting' ? (
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <RiskForecastingView
                repoUrl={repoUrl}
                branch={currentBranch}
                onBack={() => setActiveView('engineering-insights')}
              />
            </Box>
          ) : null}
        </Box>
      </Box>

      {loading && (
        <Box sx={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          bgcolor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2
        }}>
          <CircularProgress thickness={5} size={48} sx={{ color: '#6366f1' }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#4338ca', letterSpacing: '1px' }}>
            PROCESSING...
          </Typography>
        </Box>
      )}

      <AppModals
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        handleCreateFeature={handleCreateFeature}
        targetFolder={targetFolder}
        tree={tree}
        settingsModalOpen={settingsModalOpen}
        setSettingsModalOpen={setSettingsModalOpen}
        refreshTree={refreshTree}
        repoUrl={repoUrl}
        handleSwitchRepo={handleSwitchRepo}
        runModalOpen={runModalOpen}
        setRunModalOpen={setRunModalOpen}
        availableBranches={availableBranches}
        currentBranch={currentBranch}
        executePipeline={executePipeline}
        loading={loading}
        runDetailsModalOpen={runDetailsModalOpen}
        setRunDetailsModalOpen={setRunDetailsModalOpen}
        currentRunId={currentRunId}
        pushModalOpen={pushModalOpen}
        setPushModalOpen={setPushModalOpen}
        executePush={executePush}
        undoModalOpen={undoModalOpen}
        setUndoModalOpen={setUndoModalOpen}
        executeUndo={executeUndo}
      />

      <Snackbar open={status.open} autoHideDuration={6000} onClose={() => setStatus({ ...status, open: false })}>
        <Alert severity={status.severity} sx={{ width: '100%' }}>{status.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
