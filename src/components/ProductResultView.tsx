import React, { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Tag,
  Image as ImageIcon,
  Layers,
  Droplets,
  BookOpen,
  Globe2,
  Info,
  Search,
  RefreshCw,
  Camera,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ProductAnalysisResponse, OfficialImageInfo } from '../types';
import { BannerGeneratorModal } from './BannerGeneratorModal';

interface ProductResultViewProps {
  data: ProductAnalysisResponse;
  imagePreview: string | null;
  onReset: () => void;
}

export const ProductResultView: React.FC<ProductResultViewProps> = ({
  data,
  imagePreview,
  onReset,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedBenefits, setCopiedBenefits] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [showAdditionalReference, setShowAdditionalReference] = useState(false);

  // Official Image State
  const [officialImage, setOfficialImage] = useState<OfficialImageInfo | undefined>(data.officialImage);
  const [activeDisplayImage, setActiveDisplayImage] = useState<'official' | 'original'>(
    data.officialImage?.isFound ? 'official' : 'original'
  );
  const [manualCodeQuery, setManualCodeQuery] = useState(data.detectedDetails.productCode || '');
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const { detectedDetails, urduContent, formattedUrduSummary } = data;

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formattedUrduSummary);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCopyBenefitsOnly = async () => {
    try {
      const text = `${urduContent.productNameUrdu} کے تصدیق شدہ فوائد:\n\n` +
        urduContent.benefits.map((b, i) => `${i + 1}. ${b}`).join('\n');
      await navigator.clipboard.writeText(text);
      setCopiedBenefits(true);
      setTimeout(() => setCopiedBenefits(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Oriflame ${detectedDetails.productNameEnglish}`,
          text: formattedUrduSummary,
        });
      } catch (e) {
        handleCopyAll();
      }
    } else {
      handleCopyAll();
    }
  };

  const handleSearchOfficialImage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualCodeQuery.trim()) return;

    setIsSearchingImage(true);
    setSearchFeedback(null);

    try {
      const res = await fetch('/api/search-official-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productCode: manualCodeQuery.trim() }),
      });

      const result: OfficialImageInfo = await res.json();
      setOfficialImage(result);

      if (result.isFound) {
        setActiveDisplayImage('official');
        setSearchFeedback(`Successfully verified official studio packshot for code #${result.verifiedProductCode}.`);
      } else {
        setSearchFeedback(result.fallbackReason || 'No official studio image found for this code.');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchFeedback('Failed to query Oriflame media CDN. Preserving original photo.');
    } finally {
      setIsSearchingImage(false);
    }
  };

  const displayedImageSrc =
    activeDisplayImage === 'official' && officialImage?.imageBase64
      ? officialImage.imageBase64
      : imagePreview;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in text-stone-100">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121214] p-4 rounded-2xl border border-stone-800 shadow-xl">
        <button
          onClick={onReset}
          type="button"
          className="inline-flex items-center text-xs font-semibold text-stone-300 hover:text-white px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Upload New Image
        </button>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white border border-stone-800 hover:bg-stone-800 transition-colors cursor-pointer"
            title="Share Urdu Summary"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopyAll}
            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              copiedAll
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30'
            }`}
          >
            {copiedAll ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                <span>Copy Full Urdu Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Overview Card */}
      <div className="bg-[#121214] rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Active Product Image Display */}
          <div className="w-full sm:w-52 flex flex-col items-center gap-2.5 shrink-0">
            <div className="relative w-full h-52 rounded-2xl bg-black/60 border border-stone-800 overflow-hidden flex items-center justify-center p-3 shadow-inner">
              {displayedImageSrc && (
                <img
                  src={displayedImageSrc}
                  alt={detectedDetails.productNameEnglish}
                  className="w-full h-full object-contain"
                />
              )}

              {/* Status Badge over thumbnail */}
              <div className="absolute top-2 right-2">
                {activeDisplayImage === 'official' && officialImage?.isFound ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-xs">
                    Official Studio Image
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-900/80 text-stone-300 border border-stone-700 backdrop-blur-xs">
                    Uploaded Photo
                  </span>
                )}
              </div>
            </div>

            {/* Quick Switcher between Official Image and Uploaded Photo */}
            {officialImage?.isFound && imagePreview && (
              <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800 text-[11px] w-full">
                <button
                  type="button"
                  onClick={() => setActiveDisplayImage('official')}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center cursor-pointer ${
                    activeDisplayImage === 'official'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Official Shot
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDisplayImage('original')}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center cursor-pointer ${
                    activeDisplayImage === 'original'
                      ? 'bg-stone-700/50 text-white border border-stone-600'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Original Photo
                </button>
              </div>
            )}
          </div>

          {/* Product Identification Details */}
          <div className="flex-1 space-y-3 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Verified Oriflame Identity
              </span>

              {detectedDetails.productCode && detectedDetails.productCode !== 'Not visible / فراہم نہیں' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-stone-900 text-stone-200 border border-stone-700">
                  <Tag className="w-3 h-3 mr-1 text-amber-400" />
                  Code: {detectedDetails.productCode}
                </span>
              )}

              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-800 text-stone-300 border border-stone-700">
                {detectedDetails.productRangeOrLine}
              </span>
            </div>

            {/* Urdu Main Title */}
            <h2 className="font-urdu-title text-2xl sm:text-3xl font-bold text-amber-200 leading-relaxed text-right" dir="rtl">
              {urduContent.productNameUrdu}
            </h2>

            {/* English Name Subtitle */}
            <div className="text-sm font-medium text-stone-400 flex items-center flex-wrap gap-2">
              <span className="font-semibold text-white">{detectedDetails.productNameEnglish}</span>
              <span className="text-stone-600">•</span>
              <span className="text-stone-400">{detectedDetails.categoryEnglish}</span>
            </div>

            {/* Urdu Category Tag */}
            <div className="pt-1 flex flex-wrap gap-2 text-xs" dir="rtl">
              <span className="bg-stone-900 border border-stone-800 text-stone-300 px-3 py-1.5 rounded-xl">
                <strong className="text-amber-400">کیٹیگری:</strong> {urduContent.categoryUrdu}
              </span>
              <span className="bg-stone-900 border border-stone-800 text-stone-300 px-3 py-1.5 rounded-xl">
                <strong className="text-amber-400">رینج:</strong> {urduContent.rangeUrdu}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Product Image Verification Box */}
      <div className="bg-[#121214] rounded-3xl p-5 sm:p-6 border border-stone-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Official Oriflame Product Image Search
              </h4>
              <p className="text-xs text-stone-400">
                Automatic retrieval from official Oriflame Media CDN (media-cdn.oriflame.com)
              </p>
            </div>
          </div>

          {officialImage?.isFound ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Studio Packshot Found
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-stone-900 text-stone-400 border border-stone-800 self-start sm:self-auto">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Original Photo Fallback Active
            </span>
          )}
        </div>

        {/* Status description */}
        <div className="text-xs text-stone-300 leading-relaxed space-y-1">
          {officialImage?.isFound ? (
            <div className="p-3 rounded-xl bg-[#18181b] border border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-stone-400">
              <div>
                <span className="font-semibold text-stone-200">Source: </span>
                <span>{officialImage.source}</span>
                <span className="mx-2">•</span>
                <span className="font-mono">Code #{officialImage.verifiedProductCode}</span>
                {officialImage.fileSizeBytes && (
                  <span className="ml-2 font-mono">({Math.round(officialImage.fileSizeBytes / 1024)} KB)</span>
                )}
              </div>
              <span className="text-[11px] text-amber-400 font-medium">Ready for Advertising Banner</span>
            </div>
          ) : (
            <p className="text-stone-400">
              {officialImage?.fallbackReason ||
                'Official high-resolution image could not be automatically located on the Oriflame catalog CDN. Your authentic uploaded photo is preserved as fallback.'}
            </p>
          )}

          {searchFeedback && (
            <p className="text-xs text-amber-300 font-medium pt-1">{searchFeedback}</p>
          )}
        </div>

        {/* Manual search/retry box */}
        <form onSubmit={handleSearchOfficialImage} className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={manualCodeQuery}
              onChange={(e) => setManualCodeQuery(e.target.value)}
              placeholder="Search official packshot by 5-digit code (e.g. 1276, 31601, 42566, 34841)..."
              className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-900 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingImage || !manualCodeQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold text-xs border border-stone-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSearchingImage ? 'animate-spin' : ''}`} />
            <span>Search Official Image</span>
          </button>
        </form>
      </div>

      {/* Pure Product Benefits Section (5-10 Concise Benefits in Urdu Script) */}
      <div className="bg-[#121214] rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Product Benefits (اہم فوائد)
              </h3>
              <p className="text-xs text-stone-400">
                Verified cosmetic benefits in authentic Urdu script
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyBenefitsOnly}
            className="text-xs text-amber-300 hover:text-amber-200 font-semibold px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            {copiedBenefits ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Benefits Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Benefits Only</span>
              </>
            )}
          </button>
        </div>

        {/* Benefits List in Urdu Script */}
        <div className="space-y-3.5" dir="rtl">
          {urduContent.benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start space-x-3.5 space-x-reverse p-4 rounded-2xl bg-[#18181b] hover:bg-[#1f1f23] border border-stone-800/80 transition-colors"
            >
              <div className="w-7 h-7 rounded-xl bg-linear-to-tr from-amber-500 to-yellow-600 text-stone-950 flex items-center justify-center text-xs font-black shrink-0 mt-1 shadow-md shadow-amber-500/20">
                {index + 1}
              </div>
              <p className="font-urdu text-base sm:text-lg text-stone-100 leading-loose flex-1">
                {benefit}
              </p>
            </div>
          ))}
        </div>

        {/* Clarification Note on Benefits */}
        <div className="pt-2 text-xs text-stone-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Pure cosmetic benefits only. Precautions, medical claims, and application instructions are not mixed into this list.
          </span>
        </div>
      </div>

      {/* Prominent "Generate Product Banner" Button */}
      <div className="bg-linear-to-r from-stone-900 via-[#18181b] to-stone-900 rounded-3xl p-6 sm:p-7 border border-amber-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Strict 9:16 Ultra-HD Advertisement • Balanced Two-Column Layout</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white">
            Generate Product Advertising Banner
          </h3>
          <p className="text-xs text-stone-400 max-w-md">
            Compose a professional 9:16 vertical advertising banner in a balanced two-column Pure Skin layout with fine edge preservation, clean layer separation, and authentic Urdu benefits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsBannerModalOpen(true)}
          className="w-full md:w-auto px-7 py-3.5 rounded-2xl bg-linear-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-stone-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:scale-[1.02]"
        >
          <ImageIcon className="w-5 h-5 text-stone-950" />
          <span>Generate Product Banner</span>
        </button>
      </div>

      {/* Key Ingredients & Verified Claims Distinction */}
      <div className="bg-[#121214] rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-2xl space-y-5">
        <div className="flex items-center space-x-3 border-b border-stone-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Key Ingredients & Known Cosmetic Functions
            </h3>
            <p className="text-xs text-stone-400">
              Clear distinction between official Oriflame packaging claims and cosmetic science
            </p>
          </div>
        </div>

        {/* Claims Distinction Statement */}
        <div className="bg-[#18181b] border border-amber-500/20 rounded-2xl p-4 text-xs space-y-1.5" dir="rtl">
          <div className="flex items-center space-x-1.5 space-x-reverse font-bold text-amber-400">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>اجزاء اور دعووں کی تفریق (Claims Distinction):</span>
          </div>
          <p className="font-urdu text-sm text-stone-300 leading-relaxed">
            {urduContent.officialClaimsDistinctionUrdu}
          </p>
        </div>

        {/* Ingredients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {urduContent.keyIngredients.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl border border-stone-800 bg-[#18181b] flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white">
                  {item.name}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    item.isOfficialClaim
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-stone-800 text-stone-400 border border-stone-700'
                  }`}
                >
                  {item.isOfficialClaim ? 'Official Claim' : 'Cosmetic Science'}
                </span>
              </div>
              <p className="font-urdu text-sm text-stone-300 leading-relaxed text-right" dir="rtl">
                {item.cosmeticFunctionUrdu}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible Additional Reference (Usage, Precautions, Official Source) */}
      <div className="bg-[#121214] rounded-3xl border border-stone-800 overflow-hidden shadow-xl">
        <button
          type="button"
          onClick={() => setShowAdditionalReference(!showAdditionalReference)}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#18181b] transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-white">
                Application Instructions, Precautions & Verification Source
              </h4>
              <p className="text-xs text-stone-400">
                View instructions and precautionary patch-test guidance in Urdu
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-semibold px-3 py-1 rounded-xl bg-stone-900 border border-stone-800">
            {showAdditionalReference ? 'Hide Details' : 'View Details'}
          </span>
        </button>

        {showAdditionalReference && (
          <div className="p-6 pt-0 space-y-5 border-t border-stone-800/80 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* How To Use */}
              <div className="p-4 rounded-2xl bg-[#18181b] border border-stone-800 space-y-2 text-right" dir="rtl">
                <span className="text-xs font-bold text-amber-400 block font-sans">
                  استعمال کا طریقہ (How to Use):
                </span>
                <p className="font-urdu text-sm text-stone-300 leading-loose">
                  {urduContent.howToUseUrdu}
                </p>
              </div>

              {/* Precautions */}
              <div className="p-4 rounded-2xl bg-[#18181b] border border-stone-800 space-y-2 text-right" dir="rtl">
                <span className="text-xs font-bold text-amber-400 block font-sans">
                  احتیاطی تدابیر (Precautions):
                </span>
                <p className="font-urdu text-sm text-stone-300 leading-loose">
                  {urduContent.precautionsUrdu}
                </p>
              </div>
            </div>

            {/* Official Source Note */}
            <div className="p-4 rounded-2xl bg-[#18181b] border border-stone-800 flex items-start space-x-3 text-xs text-stone-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="text-stone-200">Official Product Source:</strong>
                <p>{urduContent.verifiedSourceNoteUrdu}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Regional Variation Disclaimer Note */}
      <div className="bg-[#121214] rounded-2xl p-4 sm:p-5 border border-stone-800 flex items-start space-x-3.5 text-xs text-stone-400">
        <Globe2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 w-full text-right" dir="rtl">
          <span className="font-bold text-amber-300 font-sans block text-left">
            Regional Availability & Formulation Notice:
          </span>
          <p className="font-urdu text-sm text-stone-300 leading-relaxed">
            {urduContent.countryDisclaimerUrdu}
          </p>
        </div>
      </div>

      {/* Full Plain-Text Summary Copy Box */}
      <div className="bg-[#0e0e10] text-stone-100 rounded-3xl p-6 sm:p-7 space-y-4 border border-stone-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h4 className="text-xs font-semibold text-stone-300">
              Formatted Urdu Text Summary (WhatsApp / Social Media)
            </h4>
          </div>
          <button
            onClick={handleCopyAll}
            className="text-xs bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 transition-colors cursor-pointer inline-flex items-center"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copiedAll ? 'Copied' : 'Copy All'}
          </button>
        </div>

        <pre className="font-urdu text-stone-300 text-sm whitespace-pre-wrap leading-loose max-h-56 overflow-y-auto bg-black/60 p-4 rounded-xl border border-stone-800/80 text-right" dir="rtl">
          {formattedUrduSummary}
        </pre>
      </div>

      {/* Advertising Banner Generator Modal */}
      <BannerGeneratorModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        data={data}
        originalImageSrc={imagePreview}
        officialImageSrc={officialImage?.imageBase64 || null}
      />
    </div>
  );
};
