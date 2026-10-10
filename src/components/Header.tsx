import React from 'react';
import { ShieldCheck, HelpCircle, Sparkles, Image as ImageIcon, FileText } from 'lucide-react';

interface HeaderProps {
  onOpenInfo: () => void;
  serverOnline: boolean;
  activeTab: 'extractor' | 'banner';
  onTabChange: (tab: 'extractor' | 'banner') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInfo,
  serverOnline,
  activeTab,
  onTabChange,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-md border-b border-stone-800 shadow-xl">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand Identity */}
        <div className="flex items-center space-x-3.5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-amber-500 via-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/40 shrink-0">
              <span className="text-stone-950 font-serif font-black text-base tracking-wider">ZK</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold tracking-widest text-amber-400 uppercase font-mono">
                  ORIFLAME SWEDEN
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <ShieldCheck className="w-3 h-3 mr-1 text-amber-400" />
                  Verified
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>ZK Oriflame Products Benefit Extractor</span>
              </h1>
            </div>
          </div>

          {/* Mobile Info Button */}
          <div className="sm:hidden flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <button
              onClick={onOpenInfo}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feature Navigation Tabs (Benefits Extractor vs Generate Banner) */}
        <div className="flex items-center bg-stone-900 p-1 rounded-2xl border border-stone-800 text-xs w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => onTabChange('extractor')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'extractor'
                ? 'bg-linear-to-r from-amber-400 to-yellow-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Benefits Extractor</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('banner')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'banner'
                ? 'bg-linear-to-r from-amber-400 to-yellow-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Generate Banner</span>
          </button>
        </div>

        {/* Desktop Controls */}
        <div className="hidden sm:flex items-center space-x-3">
          <div className="flex items-center space-x-2 pl-2 border-l border-stone-800">
            <div
              className={`w-2 h-2 rounded-full ${
                serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
              title={serverOnline ? 'AI Server Online' : 'Checking status...'}
            />
            <button
              onClick={onOpenInfo}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              title="Guidelines & Verification Policy"
              aria-label="App Information"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
