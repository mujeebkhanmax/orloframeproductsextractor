import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  X,
  Sparkles,
  Hash,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SAMPLE_PRODUCTS, generateSampleDataUrl, SampleProduct } from '../data/samples';

interface ImageUploaderProps {
  onAnalyze: (imageBase64: string, mimeType: string, userHint?: string) => void;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onAnalyze, isLoading }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [imageMeta, setImageMeta] = useState<{ name: string; size: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [userHint, setUserHint] = useState('');
  const [showHintField, setShowHintField] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WEBP image format.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setMimeType(file.type);
      setSelectedSampleId(null);
      setImageMeta({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImageMeta(null);
    setSelectedSampleId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSelectSample = (sample: SampleProduct) => {
    const dataUrl = generateSampleDataUrl(sample);
    setSelectedImage(dataUrl);
    setMimeType('image/svg+xml');
    setSelectedSampleId(sample.id);
    setImageMeta({
      name: `${sample.name}.svg`,
      size: 'Sample Pack Preview',
    });
    setUserHint(`${sample.name} (Code: ${sample.code})`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;
    onAnalyze(selectedImage, mimeType, userHint.trim() || undefined);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Introduction Hero Card */}
      <div className="bg-[#121214] rounded-3xl p-6 sm:p-7 border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Oriflame Sweden • Product Benefits & Banner AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Upload Oriflame Product Photo
            </h2>
            <p className="text-sm text-stone-400 max-w-xl leading-relaxed">
              Upload any clear photo of an Oriflame cream, serum, fragrance, or wellness product. The AI will inspect the packaging, extract 5–10 verified benefits in authentic Urdu script, and generate a luxury 19:16 advertising banner.
            </p>
          </div>
          <div className="shrink-0 flex items-center">
            <span className="text-xs bg-stone-900 border border-amber-500/30 text-amber-300 px-3.5 py-2 rounded-xl font-medium shadow-xs">
              ✓ Verified Claims Only
            </span>
          </div>
        </div>
      </div>

      {/* Main Upload Box */}
      <div className="bg-[#121214] rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-xl transition-all">
        {!selectedImage ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative rounded-2xl border-2 border-dashed transition-all p-8 sm:p-12 text-center cursor-pointer ${
              isDragOver
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                : 'border-stone-800 hover:border-amber-500/50 bg-[#18181b]/60 hover:bg-[#18181b]'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1c1c20] shadow-lg border border-amber-500/20 flex items-center justify-center text-amber-400 transform transition-transform hover:scale-105">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <p className="text-base font-semibold text-white">
                  Drag and drop product image here, or browse files
                </p>
                <p className="text-xs text-stone-400">
                  Accepts JPG, PNG, and WEBP formats • Up to 15MB
                </p>
              </div>

              {/* Action Buttons inside uploader */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white border border-stone-700 shadow-xs transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 mr-1 text-amber-400" />
                  Select Image
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-linear-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-stone-950 font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 mr-1 text-stone-950" />
                  Capture Photo
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Preview State */
          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-[#18181b] p-4 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-xl overflow-hidden bg-black/60 shadow-inner border border-stone-800 shrink-0 flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Selected Oriflame Product"
                  className="w-full h-full object-contain p-2"
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Image Selected
                  </span>
                  {selectedSampleId && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-800 text-stone-300 border border-stone-700">
                      Sample Pack
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-white text-sm truncate max-w-xs">
                  {imageMeta?.name || 'Selected Product Photo'}
                </h3>
                <p className="text-xs text-stone-400 font-mono">
                  {imageMeta?.size || 'Ready for analysis'}
                </p>

                <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs px-3 py-1.5 rounded-lg border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 font-medium transition-colors cursor-pointer"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 font-medium transition-colors inline-flex items-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Hint Toggle */}
            <div className="bg-[#18181b] rounded-2xl p-4 border border-stone-800">
              <button
                type="button"
                onClick={() => setShowHintField(!showHintField)}
                className="w-full flex items-center justify-between text-left text-xs font-medium text-stone-300 hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-400" />
                  Have product code or exact name? (Optional assistant hint)
                </span>
                {showHintField ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
              </button>

              {showHintField && (
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={userHint}
                    onChange={(e) => setUserHint(e.target.value)}
                    placeholder="e.g., Tender Care Protecting Balm, or code 1276, 31601, 42566..."
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-900 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-400"
                  />
                  <p className="text-[11px] text-stone-400">
                    Helpful if the bottle label is curved, partially reflective, or dimly lit.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-amber-400 via-amber-500 to-yellow-600 hover:from-amber-300 hover:to-yellow-500 text-stone-950 font-bold text-base shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-5 h-5 text-stone-950" />
                <span>Extract Product Benefits in Urdu</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Test Samples */}
      <div className="bg-[#121214] rounded-3xl p-5 border border-stone-800 shadow-lg">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Quick Test Samples
            </h3>
          </div>
          <span className="text-[11px] text-stone-500">Test instantly in 1 click</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SAMPLE_PRODUCTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 group relative overflow-hidden ${
                selectedSampleId === sample.id
                  ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                  : 'border-stone-800 hover:border-amber-500/40 bg-[#18181b] hover:bg-stone-800/80'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: sample.svgColor }}
                />
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-900 text-amber-300 border border-stone-700">
                  #{sample.code}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                  {sample.name}
                </p>
                <p className="text-[10px] text-stone-400 line-clamp-1">{sample.range}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
