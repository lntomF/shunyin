import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { BetaIntroModal } from './components/BetaIntroModal';
import { SettingsPanel } from './components/SettingsPanel';
import { HomeView } from './components/views/HomeView';
import { EditorView } from './components/views/EditorView';
import { ExportView } from './components/views/ExportView';
import { styleTemplates } from './data/mockData';
import { useAuth } from './hooks/useAuth';
import { useCloudWorkspace } from './hooks/useCloudWorkspace';
import { useWorkspaceState } from './hooks/useWorkspaceState';
import { getDictionary } from './i18n/translations';

export default function App() {
  const { state, actions } = useWorkspaceState();
  const auth = useAuth();
  const [isBetaIntroVisible, setIsBetaIntroVisible] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dict = getDictionary(state.language);
  const cloud = useCloudWorkspace(auth.user, state.language);
  const activeView = state.currentView === 'styles' ? 'editor' : state.currentView;
  const selectedStyle = useMemo(
    () => styleTemplates.find((template) => template.id === state.selectedStyleId) ?? styleTemplates[0],
    [state.selectedStyleId],
  );
  const selectedStyleTitle = dict[selectedStyle.titleKey];
  const cloudMessage = cloud.status === 'disabled'
    ? dict.cloudUnavailableMessage
    : cloud.status === 'loading'
      ? dict.cloudProfileLoading
      : cloud.status === 'saved'
        ? dict.cloudWorkspaceSaved
        : cloud.status === 'error'
          ? cloud.errorMessage ?? dict.cloudSaveFailed
          : cloud.profile
            ? dict.cloudSaveReady
            : null;

  const saveCloudWorkspace = async () => {
    const result = await cloud.saveWorkspace({
      items: state.workspaceItems,
      selectedImageId: state.selectedImageId,
      cloudWorkspaceId: state.currentCloudWorkspaceId,
    });
    actions.setCurrentCloudWorkspace(result.workspaceId);
    if (result.session) {
      actions.loadSession(result.session);
    }
  };

  const handleDeleteCloudImage = async (imageId: string) => {
    const targetItem = state.workspaceItems.find((item) => item.id === imageId);
    if (!targetItem) {
      return;
    }

    if (!state.currentCloudWorkspaceId || targetItem.image.source !== 'cloud') {
      actions.removeImage(imageId);
      return;
    }

    if (!cloud.isEnabled) {
      window.alert(dict.cloudUnavailableMessage);
      return;
    }

    if (!auth.user) {
      window.alert(dict.cloudSignInRequired);
      return;
    }

    const shouldDelete = window.confirm(dict.deleteCloudPhotoConfirm);
    if (!shouldDelete) {
      return;
    }

    const result = await cloud.deletePhoto(state.currentCloudWorkspaceId, imageId);

    if (!result.session || !result.workspaceId) {
      actions.setCurrentCloudWorkspace(null);
      actions.useDemoImage();
      actions.setCurrentView('import');
      return;
    }

    actions.setCurrentCloudWorkspace(result.workspaceId);
    actions.loadSession(result.session);
  };

  const settingsPanel = (
    <SettingsPanel
      dict={dict}
      open={isSettingsOpen}
      language={state.language}
      cloudEnabled={cloud.isEnabled}
      authStatus={auth.status}
      userEmail={cloud.profile?.email ?? auth.user?.email ?? null}
      cloudStatus={cloud.status}
      cloudMessage={cloudMessage}
      onClose={() => setIsSettingsOpen(false)}
      onSignIn={auth.signIn}
      onSignUp={auth.signUp}
      onVerifySignUpOtp={auth.verifySignupOtp}
      onResendSignUpOtp={auth.resendSignupOtp}
      onSendPasswordReset={auth.sendPasswordReset}
      onUpdatePassword={auth.updatePassword}
      isRecoveryMode={auth.isRecoveryMode}
      onClearRecoveryMode={auth.clearRecoveryMode}
      onSignOut={auth.signOut}
      onSaveCloud={saveCloudWorkspace}
    />
  );

  return (
    <>
      <div className="min-h-screen bg-background text-on-surface">
        <Header
          dict={dict}
          language={state.language}
          setLanguage={actions.setLanguage}
          brandName={dict.brandName}
          settingsLabel={dict.settingsLabel}
          sourceImage={state.sourceImage}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="relative">
          <AnimatePresence mode="wait">
            {activeView === 'import' && (
              <HomeView
                dict={dict}
                language={state.language}
                sessions={state.recentSessions}
                cloudSessions={cloud.cloudSessions}
                showCloudSessions={auth.status === 'authenticated' && cloud.isEnabled}
                sourceImage={state.sourceImage}
                workspaceCount={state.workspaceItems.length}
                uploadStatus={state.uploadStatus}
                uploadError={state.uploadError}
                onImportFiles={actions.importFiles}
                onUploadStatusChange={actions.setUploadStatus}
                onOpenSession={actions.openSession}
                onOpenCloudSession={async (session) => {
                  if (!session.cloudWorkspaceId) {
                    actions.loadSession(session);
                    return;
                  }

                  const nextSession = await cloud.openWorkspace(session.cloudWorkspaceId);
                  if (nextSession) {
                    actions.loadSession(nextSession);
                  }
                }}
                onDeleteCloudSession={async (session) => {
                  if (!session.cloudWorkspaceId) {
                    return;
                  }

                  const shouldDelete = window.confirm(dict.deleteCloudWorkspaceConfirm);
                  if (!shouldDelete) {
                    return;
                  }

                  await cloud.deleteWorkspace(session.cloudWorkspaceId);

                  if (state.currentCloudWorkspaceId === session.cloudWorkspaceId) {
                    actions.useDemoImage();
                    actions.setCurrentView('import');
                  }
                }}
                deletingCloudWorkspaceId={cloud.deletingWorkspaceId}
                onContinueEditing={() => actions.setCurrentView('editor')}
                onUseDemo={actions.useDemoImage}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}

            {activeView === 'editor' && (
              <EditorView
                dict={dict}
                sourceImage={state.sourceImage}
                exifData={state.exifData}
                workspaceItems={state.workspaceItems}
                selectedImageId={state.selectedImageId}
                previewMode={state.previewMode}
                selectedStyle={selectedStyle}
                selectedStyleTitle={selectedStyleTitle}
                styleTemplates={styleTemplates}
                onSelectImage={actions.selectImage}
                onDeleteImage={handleDeleteCloudImage}
                deletingImageId={cloud.deletingPhotoId}
                onExifChange={actions.changeExif}
                onPreviewModeChange={actions.setPreviewMode}
                onSelectStyle={actions.selectStyle}
                onApply={() => actions.setCurrentView('export')}
              />
            )}

            {activeView === 'export' && (
              <ExportView
                dict={dict}
                sourceImage={state.sourceImage}
                exifData={state.exifData}
                workspaceItems={state.workspaceItems}
                selectedImageId={state.selectedImageId}
                exportHistory={state.exportHistory}
                exportSettings={state.exportSettings}
                exportStatus={state.exportStatus}
                notice={state.notice}
                previewMode={state.previewMode}
                selectedStyle={selectedStyle}
                selectedStyleTitle={selectedStyleTitle}
                onSelectImage={actions.selectImage}
                onDeleteImage={handleDeleteCloudImage}
                deletingImageId={cloud.deletingPhotoId}
                onExportSettingsChange={actions.changeExportSettings}
                onExportCurrent={() => actions.exportCurrent(selectedStyle, selectedStyleTitle, dict.brandName)}
                onExportAll={() => actions.exportAll(selectedStyle, selectedStyleTitle, dict.brandName)}
              />
            )}
          </AnimatePresence>
        </main>

        <BottomNav currentView={activeView} setCurrentView={actions.setCurrentView} dict={dict} />
      </div>

      <BetaIntroModal
        dict={dict}
        open={isBetaIntroVisible}
        onAcknowledge={() => setIsBetaIntroVisible(false)}
      />

      {settingsPanel}
    </>
  );
}
