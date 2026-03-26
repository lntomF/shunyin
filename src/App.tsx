import { useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/views/HomeView';
import { EditorView } from './components/views/EditorView';
import { StylesView } from './components/views/StylesView';
import { ExportView } from './components/views/ExportView';
import { styleTemplates } from './data/mockData';
import { useAuth } from './hooks/useAuth';
import { useCloudWorkspace } from './hooks/useCloudWorkspace';
import { useWorkspaceState } from './hooks/useWorkspaceState';
import { getDictionary } from './i18n/translations';

export default function App() {
  const { state, actions } = useWorkspaceState();
  const auth = useAuth();
  const dict = getDictionary(state.language);
  const cloud = useCloudWorkspace(auth.user, state.language);
  const selectedStyle = useMemo(
    () => styleTemplates.find((template) => template.id === state.selectedStyleId) ?? styleTemplates[0],
    [state.selectedStyleId],
  );
  const selectedStyleTitle = dict[selectedStyle.titleKey];
  const cloudMessage = cloud.status === 'loading'
    ? dict.cloudProfileLoading
    : cloud.status === 'saved'
      ? dict.cloudWorkspaceSaved
      : cloud.status === 'error'
        ? cloud.errorMessage ?? dict.cloudSaveFailed
        : cloud.profile
          ? dict.cloudSaveReady
          : null;
  const handleDeleteCloudImage = async (imageId: string) => {
    const targetItem = state.workspaceItems.find((item) => item.id === imageId);
    if (!targetItem) {
      return;
    }

    if (!state.currentCloudWorkspaceId || targetItem.image.source !== 'cloud') {
      actions.removeImage(imageId);
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

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header
        dict={dict}
        language={state.language}
        setLanguage={actions.setLanguage}
        brandName={dict.brandName}
        settingsLabel={dict.settingsLabel}
        authStatus={auth.status}
        userEmail={cloud.profile?.email ?? auth.user?.email ?? null}
        cloudStatus={cloud.status}
        cloudMessage={cloudMessage}
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
        onSignOut={auth.signOut}
        onSaveCloud={async () => {
          const result = await cloud.saveWorkspace({
            items: state.workspaceItems,
            selectedImageId: state.selectedImageId,
            cloudWorkspaceId: state.currentCloudWorkspaceId,
          });
          actions.setCurrentCloudWorkspace(result.workspaceId);
          if (result.session) {
            actions.loadSession(result.session);
          }
        }}
      />

      <main className="relative">
        <AnimatePresence mode="wait">
          {state.currentView === 'import' && (
            <HomeView
              dict={dict}
              language={state.language}
              sessions={state.recentSessions}
              cloudSessions={cloud.cloudSessions}
              showCloudSessions={auth.status === 'authenticated'}
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
                  actions.setCurrentCloudWorkspace(null);
                  actions.setCurrentView('import');
                }
              }}
              deletingCloudWorkspaceId={cloud.deletingWorkspaceId}
              onContinueEditing={() => actions.setCurrentView('editor')}
              onUseDemo={actions.useDemoImage}
            />
          )}

          {state.currentView === 'editor' && (
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

          {state.currentView === 'styles' && (
            <StylesView
              dict={dict}
              language={state.language}
              sourceImage={state.sourceImage}
              exifData={state.exifData}
              selectedStyleId={state.selectedStyleId}
              styleTemplates={styleTemplates}
              exportHistory={state.exportHistory}
              onSelectStyle={actions.selectStyle}
              onCreateNew={() => actions.setCurrentView('editor')}
            />
          )}

          {state.currentView === 'export' && (
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

      <BottomNav currentView={state.currentView} setCurrentView={actions.setCurrentView} dict={dict} />
    </div>
  );
}
