import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Hash, ArrowLeft } from 'lucide-react';
import { ProductAnalysisResponse } from '../types';

interface ClarificationPromptProps {
  data: ProductAnalysisResponse;
  imagePreview: string | null;
  onReanalyze: (hint: string) => void;
  onReset: () => void;
  isLoading: boolean;
}

export const ClarificationPrompt: React.FC<ClarificationPromptProps> = ({
  data,
  imagePreview,
  onReanalyze,
  onReset,
  isLoading,
}) => {
  const [hint, setHint] = useState('');

  const handleRetryWithHint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hint.trim()) return;
    onReanalyze(hint.trim());
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="bg-[#121214] rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl space-y-6 text-stone-100">
        <div className="flex items-center space-x-3.5 border-b border-stone-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              Product Identity Clarification Required
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Accurate Identification Protection
            </h3>
          </div>
        </div>

        {/* Thumbnail Preview */}
        {imagePreview && (
          <div className="flex items-center space-x-4 bg-[#18181b] p-3.5 rounded-2xl border border-stone-800">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/50 shrink-0 border border-stone-800 flex items-center justify-center p-1">
              <img src={imagePreview} alt="Uploaded packaging" className="w-full h-full object-contain" />
            </div>
            <div className="text-xs text-stone-300">
              <p className="font-semibold text-white">Uploaded Product Photo Inspected</p>
              <p className="text-stone-400">
                To guarantee zero factual hallucinations, the assistant avoids guessing unconfirmed items.
              </p>
            </div>
          </div>
        )}

        {/* English Clarification Explanation */}
        <div className="bg-stone-900/80 rounded-2xl p-4 border border-stone-800 text-xs space-y-1.5">
          <h4 className="font-bold text-amber-300">
            Why is clarification needed?
          </h4>
          <p className="text-stone-300 leading-relaxed">
            {data.clarificationMessageEnglish ||
              'The product name, range, or numerical product code on the photo is partially obscured or reflective. Please provide the official product name or 5-digit product code below.'}
          </p>
        </div>

        {/* Urdu Explanation reference */}
        {data.clarificationMessageUrdu && (
          <div className="bg-[#18181b] rounded-2xl p-4 border border-stone-800/80 text-right" dir="rtl">
            <p className="font-urdu text-sm text-stone-300 leading-loose">
              {data.clarificationMessageUrdu}
            </p>
          </div>
        )}

        {/* Input Form for Product Name or 5-Digit Code */}
        <form onSubmit={handleRetryWithHint} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-amber-400" />
              Enter Product Name or 5-Digit Code (e.g. 1276, 31601, 42566):
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. Tender Care, Milk & Honey Sugar Scrub, or code 31601..."
              className="w-full text-sm px-4 py-3 rounded-2xl border border-stone-700 bg-stone-900 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400 shadow-inner"
              autoFocus
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading || !hint.trim()}
              className="flex-1 py-3 px-5 rounded-2xl bg-linear-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 disabled:opacity-50 text-stone-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Verify Product Identity</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="py-3 px-5 rounded-2xl border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              Choose Another Image
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
