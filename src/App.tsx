import { useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { BetaIntroModal } from './components/BetaIntroModal';
import { SettingsPanel } from './components/SettingsPanel';
import { JellyView } from './components/JellyView';
import { AiImageView } from './components/views/AiImageView';
import { HomeView } from './components/views/HomeView';
import { EditorView } from './components/views/EditorView';
import { ExportView } from './components/views/ExportView';
import { styleTemplates } from './data/mockData';
import { useWorkspaceState } from './hooks/useWorkspaceState';
import { getDictionary } from './i18n/translations';

export default function App() {
  const { state, actions } = useWorkspaceState();
  const [isBetaIntroVisible, setIsBetaIntroVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dict = getDictionary(state.language);
  const activeView = state.currentView === 'styles'
    ? 'editor'
    : state.currentView === 'home'
      ? 'import'
      : state.currentView;
  const selectedStyle = useMemo(
    () => styleTemplates.find((template) => template.id === state.selectedStyleId) ?? styleTemplates[0],
    [state.selectedStyleId],
  );
  const selectedStyleTitle = dict[selectedStyle.titleKey];

  const settingsPanel = (
    <SettingsPanel
      dict={dict}
      open={isSettingsOpen}
      onClose={() => setIsSettingsOpen(false)}
    />
  );

  useEffect(() => {
    const isLight = state.theme === 'light';
    document.documentElement.classList.toggle('light', isLight);
    document.documentElement.classList.toggle('dark', !isLight);
    document.documentElement.style.colorScheme = state.theme;
    document.body.classList.toggle('light', isLight);
    document.body.classList.toggle('dark', !isLight);
  }, [state.theme]);

  return (
    <>
      <div className="min-h-screen bg-background text-on-surface">
        <Header
          dict={dict}
          language={state.language}
          setLanguage={actions.setLanguage}
          theme={state.theme}
          setTheme={actions.setTheme}
          brandName={dict.brandName}
          settingsLabel={dict.settingsLabel}
          sourceImage={state.sourceImage}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="relative">
          <AnimatePresence mode="wait">
            {activeView === 'import' && (
              <JellyView key="import">
                <HomeView
                  dict={dict}
                  theme={state.theme}
                  sourceImage={state.sourceImage}
                  workspaceCount={state.workspaceItems.length}
                  uploadStatus={state.uploadStatus}
                  uploadError={state.uploadError}
                  onImportFiles={actions.importFiles}
                  onUploadStatusChange={actions.setUploadStatus}
                  onContinueEditing={() => actions.setCurrentView('editor')}
                  onOpenAiWorkspace={() => actions.setCurrentView('ai')}
                />
              </JellyView>
            )}

            {activeView === 'ai' && (
              <JellyView key="ai">
                <AiImageView dict={dict} />
              </JellyView>
            )}

            {activeView === 'editor' && state.sourceImage && state.exifData && (
              <JellyView key="editor">
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
                  onDeleteImage={actions.removeImage}
                  onExifChange={actions.changeExif}
                  onPreviewModeChange={actions.setPreviewMode}
                  onSelectStyle={actions.selectStyle}
                  onApply={() => actions.setCurrentView('export')}
                />
              </JellyView>
            )}

            {activeView === 'export' && state.sourceImage && state.exifData && (
              <JellyView key="export">
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
                  onDeleteImage={actions.removeImage}
                  onExportSettingsChange={actions.changeExportSettings}
                  onExportCurrent={() => actions.exportCurrent(selectedStyle, selectedStyleTitle, dict.brandName)}
                  onExportAll={() => actions.exportAll(selectedStyle, selectedStyleTitle, dict.brandName)}
                />
              </JellyView>
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
