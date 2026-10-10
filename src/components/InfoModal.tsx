import React from 'react';
import { X, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#121214] border border-stone-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-stone-100">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                About ZK Oriflame Benefit Extractor
              </h3>
              <p className="text-xs text-stone-400">
                Swedish Beauty & Wellness Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-stone-300 leading-relaxed">
          <div className="bg-[#18181b] p-4 rounded-2xl border border-stone-800 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Verified Cosmetic Claims Policy</span>
            </h4>
            <p className="text-stone-400 text-xs leading-relaxed">
              This application is designed for beauty consultants, customers, and enthusiasts to identify genuine Oriflame Sweden items and extract 5–10 verified benefits in authentic Urdu script without factual hallucinations.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
              <div>
                <strong className="text-white block font-sans">Pure Benefits Only:</strong>
                <p className="text-stone-400 text-xs">
                  The benefits list strictly contains verified positive cosmetic actions (hydration, radiance, exfoliation, antioxidant care). Precautions and warnings are never mixed into benefits.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
              <div>
                <strong className="text-white block font-sans">Zero Medical Inventions:</strong>
                <p className="text-stone-400 text-xs">
                  We never generate fake medical cures, disease treatments, or fabricated clinical test percentages.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
              <div>
                <strong className="text-white block font-sans">19:16 Social Media Advertising Banner:</strong>
                <p className="text-stone-400 text-xs">
                  Generate instant, ultra-high-resolution (1900 x 1600 px) promotional banners that preserve your authentic product packaging while displaying the Urdu benefits list.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
              <div>
                <strong className="text-white block font-sans">Market Availability Variations:</strong>
                <p className="text-stone-400 text-xs">
                  Packaging, shades, and availability may vary across regional markets (e.g. Pakistan, UK, EU, Middle East).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
