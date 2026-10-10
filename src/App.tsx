/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ProductResultView } from './components/ProductResultView';
import { ClarificationPrompt } from './components/ClarificationPrompt';
import { BannerStudioPage } from './components/BannerStudioPage';
import { InfoModal } from './components/InfoModal';
import { ProductAnalysisResponse } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'extractor' | 'banner'>('extractor');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysisResponse | null>(null);
  const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(null);
  const [currentMimeType, setCurrentMimeType] = useState<string>('image/jpeg');
  const [currentUserHint, setCurrentUserHint] = useState<string>('');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);

  // Check server health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setServerOnline(Boolean(data.hasApiKey));
      })
      .catch(() => {
        setServerOnline(false);
      });
  }, []);

  // Loading steps animation
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const loadingMessages = [
    {
      title: 'Inspecting Product Packaging',
      description: 'Analyzing bottle, label graphics, and Oriflame brand markings...',
    },
    {
      title: 'Verifying Official Identity & Code',
      description: 'Cross-checking official range name and 5-digit catalog code...',
    },
    {
      title: 'Searching Official Oriflame Media',
      description: 'Querying official Oriflame catalogue CDN for matching studio packshot...',
    },
    {
      title: 'Extracting Pure Urdu Benefits',
      description: 'Drafting 5–10 verified benefits in authentic Urdu script...',
    },
  ];

  const handleAnalyze = async (imageBase64: string, mimeType: string, userHint?: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentImagePreview(imageBase64);
    setCurrentMimeType(mimeType);
    if (userHint) setCurrentUserHint(userHint);

    try {
      const response = await fetch('/api/identify-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          userHint: userHint || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server request failed (Status ${response.status})`);
      }

      const result: ProductAnalysisResponse = await response.json();
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError({
        message: err.message || 'Failed to extract product benefits. Please verify the image and try again.',
        details: 'Ensure a clear image of an Oriflame beauty product is provided.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReanalyzeWithHint = (hint: string) => {
    if (currentImagePreview) {
      handleAnalyze(currentImagePreview, currentMimeType, hint);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
    setCurrentImagePreview(null);
    setCurrentUserHint('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-stone-100 selection:bg-amber-500/30 selection:text-amber-200">
      <Header
        onOpenInfo={() => setIsInfoModalOpen(true)}
        serverOnline={serverOnline}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* TAB 1: GENERATE BANNER (Dedicated standalone tool requested in Prompt) */}
        {activeTab === 'banner' && <BannerStudioPage />}

        {/* TAB 2: BENEFITS EXTRACTOR (Existing working workflow preserved 100%) */}
        {activeTab === 'extractor' && (
          <>
            {/* Loading Screen */}
            {isLoading && (
              <div className="w-full max-w-lg mx-auto bg-[#121214] rounded-3xl p-8 sm:p-10 border border-stone-800 shadow-2xl text-center space-y-6 my-10 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-stone-800 border-t-amber-400 animate-spin" />
                  <div className="w-16 h-16 rounded-full bg-linear-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/30">
                    <Sparkles className="w-8 h-8 animate-pulse text-stone-950" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase font-mono">
                    {`STEP ${loadingStep + 1} OF 4`}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {loadingMessages[loadingStep].title}
                  </h3>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                    {loadingMessages[loadingStep].description}
                  </p>
                </div>

                {/* Stepper Dots */}
                <div className="flex items-center justify-center space-x-2 pt-2">
                  {loadingMessages.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === loadingStep
                          ? 'w-8 bg-amber-400'
                          : i < loadingStep
                          ? 'w-2.5 bg-amber-600'
                          : 'w-2 bg-stone-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="w-full max-w-xl mx-auto bg-[#121214] rounded-3xl p-6 sm:p-8 border border-red-500/30 shadow-2xl space-y-5 my-8 text-center text-stone-100">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white">
                    Extraction Could Not Complete
                  </h3>
                  <p className="text-sm text-red-300 leading-relaxed max-w-md mx-auto">
                    {error.message}
                  </p>
                  {error.details && (
                    <p className="text-xs text-stone-400 font-mono mt-1">{error.details}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={() => {
                      if (currentImagePreview) {
                        handleAnalyze(currentImagePreview, currentMimeType, currentUserHint);
                      } else {
                        handleReset();
                      }
                    }}
                    className="py-3 px-6 rounded-xl bg-linear-to-r from-amber-400 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-stone-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Extraction</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="py-3 px-5 rounded-xl border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Choose Another Image
                  </button>
                </div>
              </div>
            )}

            {/* Clarification State */}
            {!isLoading && !error && analysisResult && analysisResult.needsUserClarification && (
              <ClarificationPrompt
                data={analysisResult}
                imagePreview={currentImagePreview}
                onReanalyze={handleReanalyzeWithHint}
                onReset={handleReset}
                isLoading={isLoading}
              />
            )}

            {/* Success Result State */}
            {!isLoading && !error && analysisResult && !analysisResult.needsUserClarification && (
              <ProductResultView
                data={analysisResult}
                imagePreview={currentImagePreview}
                onReset={handleReset}
              />
            )}

            {/* Default Upload State */}
            {!isLoading && !error && !analysisResult && (
              <ImageUploader onAnalyze={handleAnalyze} isLoading={isLoading} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-800/80 bg-[#09090b] py-6 text-stone-400 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <span className="font-bold text-white tracking-wide">
              ZK Oriflame Products Benefit Extractor
            </span>
            <span className="text-stone-700">•</span>
            <span className="text-amber-400 font-mono text-[11px]">
              Oriflame Sweden
            </span>
          </div>

          <p className="text-center sm:text-right text-stone-500 text-xs">
            Based on authentic packaging & verifiable formulation data. Zero fabricated claims.
          </p>

          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="text-stone-400 hover:text-amber-300 font-medium transition-colors cursor-pointer"
          >
            Guidelines & Policies
          </button>
        </div>
      </footer>

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />
    </div>
  );
}
