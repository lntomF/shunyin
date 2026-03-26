import { useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/views/HomeView';
import { EditorView } from './components/views/EditorView';
import { StylesView } from './components/views/StylesView';
import { ExportView } from './components/views/ExportView';
import { styleTemplates } from './data/mockData';
import { useWorkspaceState } from './hooks/useWorkspaceState';
import { getDictionary } from './i18n/translations';

export default function App() {
  const { state, actions } = useWorkspaceState();
  const dict = getDictionary(state.language);
  const selectedStyle = useMemo(
    () => styleTemplates.find((template) => template.id === state.selectedStyleId) ?? styleTemplates[0],
    [state.selectedStyleId],
  );
  const selectedStyleTitle = dict[selectedStyle.titleKey];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header language={state.language} setLanguage={actions.setLanguage} brandName={dict.brandName} settingsLabel={dict.settingsLabel} />

      <main className="relative">
        <AnimatePresence mode="wait">
          {state.currentView === 'import' && (
            <HomeView
              dict={dict}
              language={state.language}
              sessions={state.recentSessions}
              sourceImage={state.sourceImage}
              workspaceCount={state.workspaceItems.length}
              uploadStatus={state.uploadStatus}
              uploadError={state.uploadError}
              onImportFiles={actions.importFiles}
              onUploadStatusChange={actions.setUploadStatus}
              onOpenSession={actions.openSession}
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
