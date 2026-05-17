import { useEffect, useMemo, useState } from 'react';
import { Download, Expand, KeyRound, RefreshCw, Sparkles, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { Dictionary } from '../../i18n/translations';
import {
  createOpenAiImageJob,
  fetchOpenAiImageJob,
  fetchOpenAiModels,
  openAiImageJobToGeneratedImage,
  SHUNYIN_API_KEY_STORAGE_KEY,
  SHUNYIN_IMAGE_MODEL_STORAGE_KEY,
  type GeneratedImageAspectRatio,
  type GeneratedImageQuality,
  type OpenAiImageJob,
  type OpenAiProviderModel,
} from '../../services/openAiImageService';

interface AiImageViewProps {
  dict: Dictionary;
}

type AiJobStatus = 'idle' | 'loading' | 'done' | 'error';

interface AiImageResult {
  file: File;
  objectUrl: string;
  prompt: string;
  model?: string;
}

interface ActiveImageJob {
  id: string;
  prompt: string;
  model: string;
  status: OpenAiImageJob['status'];
  createdAt: number;
  updatedAt: number;
}

function revokeResult(result: AiImageResult | null) {
  if (result?.objectUrl) {
    URL.revokeObjectURL(result.objectUrl);
  }
}

function normalizeModelList(models: OpenAiProviderModel[]) {
  const seen = new Set<string>();

  return models
    .map((item) => ({
      ...item,
      id: item.id.trim(),
    }))
    .filter((item) => {
      if (!item.id || seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    })
    .slice(0, 120);
}

export function AiImageView({ dict }: AiImageViewProps) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [models, setModels] = useState<OpenAiProviderModel[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [autoFetchKey, setAutoFetchKey] = useState('');
  const [modelStatus, setModelStatus] = useState<AiJobStatus>('idle');
  const [modelError, setModelError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<AiImageResult | null>(null);
  const [aspectRatio, setAspectRatio] = useState<GeneratedImageAspectRatio>('auto');
  const [quality] = useState<GeneratedImageQuality>('medium');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<AiJobStatus>('idle');
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<ActiveImageJob | null>(null);
  const [pollTick, setPollTick] = useState(0);

  useEffect(() => {
    try {
      setApiKey(window.localStorage.getItem(SHUNYIN_API_KEY_STORAGE_KEY) ?? '');
      setModel(window.localStorage.getItem(SHUNYIN_IMAGE_MODEL_STORAGE_KEY) ?? '');
    } catch {
      // Local storage can be unavailable in private contexts.
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  useEffect(() => () => {
    revokeResult(resultImage);
  }, [resultImage]);

  const displayModels = useMemo(() => normalizeModelList(models), [models]);
  const trimmedModel = model.trim();
  const selectedModelInList = displayModels.some((item) => item.id === trimmedModel);
  const canRun = Boolean(apiKey.trim() && trimmedModel);

  const persistApiSettings = (nextKey = apiKey, nextModel = model) => {
    try {
      window.localStorage.setItem(SHUNYIN_API_KEY_STORAGE_KEY, nextKey);
      window.localStorage.setItem(SHUNYIN_IMAGE_MODEL_STORAGE_KEY, nextModel);
    } catch {
      // Keep the current session usable even if storage is blocked.
    }
  };

  const normalizeProviderError = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    if (/invalid token/i.test(message)) {
      return dict.aiInvalidToken;
    }

    if (/524|provider timed out|timed out|timeout/i.test(message)) {
      return dict.aiProviderTimeout;
    }

    return message;
  };

  const getJobFailureMessage = (job: OpenAiImageJob) => (
    normalizeProviderError(job.error?.providerMessage || job.error?.message || dict.aiGenerateFailed, dict.aiGenerateFailed)
  );

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    persistApiSettings(value, model);
    setAutoFetchKey('');
    setModelStatus('idle');
    setModelError(null);
    setGenerateStatus('idle');
    setGenerateError(null);
    setActiveJob(null);
  };

  const handleModelChange = (value: string) => {
    const nextModel = value.trim();
    setModel(nextModel);
    persistApiSettings(apiKey, nextModel);
  };

  const handleClearApiKey = () => {
    setApiKey('');
    setModels([]);
    setModelStatus('idle');
    setModelError(null);
    setGenerateStatus('idle');
    setGenerateError(null);
    setActiveJob(null);

    try {
      window.localStorage.removeItem(SHUNYIN_API_KEY_STORAGE_KEY);
    } catch {
      // Ignore local storage failures.
    }
  };

  const handleFetchModels = async (options?: { apiKey?: string; preferredModel?: string }) => {
    const requestKey = (options?.apiKey ?? apiKey).trim();
    const preferredModel = (options?.preferredModel ?? model).trim();

    if (!requestKey || modelStatus === 'loading') {
      return;
    }

    setModelStatus('loading');
    setModelError(null);

    try {
      const result = await fetchOpenAiModels({ apiKey: requestKey });
      const nextModels = normalizeModelList(result.imageModels.length ? result.imageModels : result.models);
      setModels(nextModels);
      if (nextModels.length && !nextModels.some((item) => item.id === preferredModel)) {
        handleModelChange(nextModels[0].id);
      }
      setModelStatus('done');
    } catch (error) {
      setModelError(normalizeProviderError(error, dict.aiModelsFailed));
      setModelStatus('error');
    }
  };

  useEffect(() => {
    const nextKey = apiKey.trim();
    if (!storageLoaded || nextKey.length < 20 || autoFetchKey === nextKey || modelStatus === 'loading') {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setAutoFetchKey(nextKey);
      void handleFetchModels({ apiKey: nextKey, preferredModel: trimmedModel });
    }, 800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [apiKey, autoFetchKey, modelStatus, storageLoaded, trimmedModel]);

  const saveResult = (nextResult: AiImageResult) => {
    setResultImage((current) => {
      if (current?.objectUrl !== nextResult.objectUrl) {
        revokeResult(current);
      }
      return nextResult;
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !canRun || generateStatus === 'loading') {
      return;
    }

    persistApiSettings();
    setGenerateStatus('loading');
    setGenerateError(null);
    setActiveJob(null);

    try {
      const job = await createOpenAiImageJob({
        apiKey: apiKey.trim(),
        model: model.trim(),
        prompt: prompt.trim(),
        aspectRatio,
        quality,
      });

      setActiveJob({
        id: job.id,
        prompt: job.prompt,
        model: job.model,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      });
      setPollTick((current) => current + 1);
    } catch (error) {
      setGenerateError(normalizeProviderError(error, dict.aiGenerateFailed));
      setGenerateStatus('error');
      setActiveJob(null);
    }
  };

  useEffect(() => {
    if (!activeJob || generateStatus !== 'loading') {
      return undefined;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const job = await fetchOpenAiImageJob(activeJob.id);
        if (cancelled) {
          return;
        }

        setActiveJob({
          id: job.id,
          prompt: job.prompt,
          model: job.model,
          status: job.status,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        });

        if (job.status === 'succeeded') {
          const generated = openAiImageJobToGeneratedImage(job);
          saveResult({
            file: generated.file,
            objectUrl: generated.objectUrl,
            prompt: job.prompt,
            model: generated.model,
          });
          setGenerateStatus('done');
          setActiveJob(null);
          return;
        }

        if (job.status === 'failed') {
          setGenerateError(getJobFailureMessage(job));
          setGenerateStatus('error');
          setActiveJob(null);
          return;
        }

        setPollTick((current) => current + 1);
      } catch (error) {
        if (!cancelled) {
          setGenerateError(normalizeProviderError(error, dict.aiGenerateFailed));
          setGenerateStatus('error');
          setActiveJob(null);
        }
      }
    }, activeJob.status === 'queued' ? 1000 : 2000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [activeJob, dict.aiGenerateFailed, generateStatus, pollTick]);

  const handleDownload = () => {
    if (!resultImage) {
      return;
    }

    const link = document.createElement('a');
    link.href = resultImage.objectUrl;
    link.download = resultImage.file.name;
    link.click();
  };

  const modelStatusText = modelStatus === 'done'
    ? `${dict.aiModelsLoaded} ${displayModels.length}`
    : modelStatus === 'error'
      ? modelError ?? dict.aiModelsFailed
      : dict.aiModelHint;

  const generateStatusText = generateStatus === 'done'
    ? dict.aiGenerated
    : generateStatus === 'error'
      ? generateError ?? dict.aiGenerateFailed
      : generateStatus === 'loading'
        ? activeJob?.status === 'running'
          ? dict.aiJobRunning
          : activeJob?.status === 'queued'
            ? dict.aiJobQueued
            : dict.aiJobCreating
        : dict.aiGenerateHint;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="mx-auto grid min-h-[calc(100dvh-8rem)] w-full max-w-[1920px] gap-4 px-3 pb-28 pt-20 sm:px-5 sm:pb-32 sm:pt-24 lg:grid-cols-[minmax(0,1.18fr)_minmax(380px,0.82fr)] lg:px-6 xl:px-8"
    >
      <section className="grid min-h-0 gap-4">
        <div className="console-panel relative overflow-hidden rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-5 lg:p-6">
          <div className="console-grid pointer-events-none absolute inset-0 opacity-18" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-tertiary">{dict.aiGenerateTitle}</div>
              <h2 className="mt-2 font-headline text-3xl font-bold leading-tight text-primary sm:text-4xl">{dict.aiWorkspaceTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-on-surface-variant sm:text-base">
                {dict.aiGenerateDescPrefix}
                <a
                  href="https://api.shunyin.eu.cc/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-tertiary underline decoration-tertiary/35 underline-offset-4 shutter-transition hover:text-secondary"
                >
                  {dict.aiRelayName}
                </a>
                {dict.aiGenerateDescSuffix}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-tertiary/20 bg-tertiary/10 text-tertiary">
              <Sparkles size={20} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="console-panel rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-5">
            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{dict.aiApiKeyLabel}</span>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative min-w-0">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => handleApiKeyChange(event.target.value)}
                    placeholder={dict.aiApiKeyPlaceholder}
                    className="h-11 w-full rounded-[0.8rem] border border-secondary/10 bg-surface/70 px-3 pr-9 text-sm text-primary outline-none shutter-transition placeholder:text-outline focus:border-tertiary/35"
                  />
                  <KeyRound size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline" />
                </div>
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  disabled={!apiKey}
                  className="h-11 rounded-[0.8rem] border border-outline-variant/15 bg-surface/55 px-4 text-xs font-bold text-on-surface-variant shutter-transition hover:border-tertiary/25 hover:text-tertiary disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {dict.aiClearApiKey}
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-on-surface-variant">{dict.aiApiKeyStorageHint}</p>
            </label>
          </div>

          <div className="console-panel rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-5">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="block min-w-0">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{dict.aiModelLabel}</span>
                <select
                  value={trimmedModel}
                  onChange={(event) => handleModelChange(event.target.value)}
                  className="h-11 w-full rounded-[0.8rem] border border-secondary/10 bg-surface/70 px-3 text-sm text-primary outline-none shutter-transition focus:border-tertiary/35"
                >
                  {!trimmedModel && <option value="">{dict.aiModelPlaceholder}</option>}
                  {trimmedModel && !selectedModelInList && <option value={trimmedModel}>{trimmedModel}</option>}
                  {displayModels.map((item) => (
                    <option key={item.id} value={item.id}>{item.id}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => void handleFetchModels()}
                disabled={!apiKey.trim() || modelStatus === 'loading'}
                className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-[0.8rem] border border-tertiary/20 bg-tertiary/10 px-4 text-xs font-bold text-tertiary shutter-transition hover:bg-tertiary/15 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <RefreshCw size={14} className={modelStatus === 'loading' ? 'animate-spin' : ''} />
                <span>{modelStatus === 'loading' ? dict.aiModelsLoading : dict.aiModelsFetch}</span>
              </button>
            </div>

            <input
              type="text"
              value={model}
              onChange={(event) => handleModelChange(event.target.value)}
              placeholder={dict.aiModelPlaceholder}
              className="mt-2 h-11 w-full rounded-[0.8rem] border border-secondary/10 bg-surface/70 px-3 text-sm text-primary outline-none shutter-transition placeholder:text-outline focus:border-tertiary/35"
            />

            <div className="mt-2 min-h-5 text-xs leading-5 text-on-surface-variant">{modelStatusText}</div>
          </div>
        </div>

        <div className="console-panel flex min-h-[22rem] flex-col rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-5 lg:p-6">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-tertiary">{dict.aiTextToImageTitle}</div>
          <textarea
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              if (generateStatus !== 'loading') {
                setGenerateStatus('idle');
                setGenerateError(null);
              }
            }}
            placeholder={dict.aiPromptPlaceholder}
            className="min-h-[13rem] flex-1 resize-none rounded-[0.95rem] border border-secondary/10 bg-surface/70 px-4 py-4 text-base leading-7 text-primary outline-none shutter-transition placeholder:text-outline focus:border-tertiary/35"
          />
          <div className="mt-4 grid gap-3 md:grid-cols-[auto_minmax(12rem,1fr)] md:items-end">
            <label className="block">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{dict.aiAspectRatioLabel}</span>
              <select
                value={aspectRatio}
                onChange={(event) => setAspectRatio(event.target.value as GeneratedImageAspectRatio)}
                className="h-12 min-w-36 rounded-[0.8rem] border border-secondary/10 bg-surface/70 px-3 text-sm text-primary outline-none shutter-transition focus:border-tertiary/35"
              >
                <option value="auto">{dict.aiRatioAuto}</option>
                <option value="1:1">{dict.aiRatio1x1}</option>
                <option value="16:9">{dict.aiRatio16x9}</option>
                <option value="9:16">{dict.aiRatio9x16}</option>
                <option value="4:3">{dict.aiRatio4x3}</option>
                <option value="3:4">{dict.aiRatio3x4}</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || !canRun || generateStatus === 'loading'}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[0.95rem] border border-tertiary/20 bg-tertiary px-5 font-headline text-sm font-bold uppercase tracking-[0.16em] text-background shutter-transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Sparkles size={17} />
              <span>{generateStatus === 'loading' ? dict.aiGenerating : dict.aiGenerateBtn}</span>
            </button>
          </div>
          <div className="mt-3 min-h-6 text-sm leading-6 text-on-surface-variant">{generateStatusText}</div>
        </div>
      </section>

      <section className="console-panel flex min-h-[34rem] flex-col rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-5 lg:min-h-0 lg:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-tertiary">{dict.aiResultTitle}</div>
            {resultImage?.model && (
              <div className="mt-2 max-w-[18rem] truncate text-xs text-on-surface-variant">{resultImage.model}</div>
            )}
          </div>
          {resultImage && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-[0.85rem] border border-tertiary/20 bg-tertiary/10 text-tertiary shutter-transition hover:bg-tertiary/15"
                aria-label={dict.aiPreviewLarge}
                title={dict.aiPreviewLarge}
              >
                <Expand size={17} />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex h-10 w-10 items-center justify-center rounded-[0.85rem] border border-secondary/20 bg-secondary/10 text-secondary shutter-transition hover:bg-secondary/15"
                aria-label={dict.aiDownloadResult}
                title={dict.aiDownloadResult}
              >
                <Download size={17} />
              </button>
            </div>
          )}
        </div>

        <div className="flex min-h-[24rem] flex-1 items-center justify-center overflow-hidden rounded-[1.1rem] border border-outline-variant/15 bg-surface-container-lowest">
          {resultImage ? (
            <img src={resultImage.objectUrl} alt={resultImage.prompt} className="h-full max-h-[calc(100dvh-15rem)] w-full object-contain" />
          ) : (
            <div className="max-w-xs px-6 text-center text-sm leading-7 text-on-surface-variant">{dict.aiResultEmpty}</div>
          )}
        </div>
      </section>

      {isPreviewOpen && resultImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/92 p-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/20 bg-surface/80 text-primary shutter-transition hover:border-tertiary/30 hover:text-tertiary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          <img
            src={resultImage.objectUrl}
            alt={resultImage.prompt}
            className="max-h-[88vh] max-w-[92vw] rounded-[1rem] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          />
        </div>
      )}
    </motion.div>
  );
}
