import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  X,
  Sparkles,
  RefreshCw,
  Palette,
  Check,
  AlertCircle,
  Sliders,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Scissors,
  Maximize2,
  MoveVertical,
  Layers,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { ProductAnalysisResponse } from '../types';
import { removeStudioBackground, SegmentationResult, BoundingBox } from '../utils/imageProcessor';
import { BANNER_BACKGROUNDS, BannerBackgroundOption } from '../data/bannerBackgrounds';

interface BannerGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProductAnalysisResponse;
  originalImageSrc: string | null;
  officialImageSrc?: string | null;
}

type ImageSourceMode = 'official' | 'original' | 'custom';
type PresentationMode = 'cutout' | 'studio-panel';

export const BannerGeneratorModal: React.FC<BannerGeneratorModalProps> = ({
  isOpen,
  onClose,
  data,
  originalImageSrc,
  officialImageSrc,
}) => {
  // Layer 1: Background selection - Default to Pure Skin Aqua Fresh for modern skincare style or Luxury Black Gold
  const defaultBgId =
    data.detectedDetails.productNameEnglish?.toLowerCase().includes('pure skin') ||
    data.detectedDetails.productRangeOrLine?.toLowerCase().includes('pure skin') ||
    data.detectedDetails.productNameEnglish?.toLowerCase().includes('tea tree')
      ? 'ai-pureskin-aqua'
      : 'ai-black-gold';

  const [selectedBgId, setSelectedBgId] = useState<string>(defaultBgId);

  // Layer 2: Product Image Source & Controls
  const [selectedImageSource, setSelectedImageSource] = useState<ImageSourceMode>(
    officialImageSrc ? 'official' : 'original'
  );
  const [customUploadedImage, setCustomUploadedImage] = useState<string | null>(null);

  // Presentation Mode: Cutout vs Studio Panel
  const [presentationMode, setPresentationMode] = useState<PresentationMode>('cutout');
  const [processedTransparentSrc, setProcessedTransparentSrc] = useState<string | null>(null);
  const [productBBox, setProductBBox] = useState<BoundingBox | undefined>(undefined);
  const [isProcessingBg, setIsProcessingBg] = useState<boolean>(false);
  const [bgSegmentationStatus, setBgSegmentationStatus] = useState<string | null>(null);

  // Sizing & Positioning: Left column prominence (65% to 85% of height)
  const [productScalePercent, setProductScalePercent] = useState<number>(75);
  const [productOffsetY, setProductOffsetY] = useState<number>(0);

  // Composition State
  const [isGenerating, setIsGenerating] = useState(true);
  const [generatedBannerUrl, setGeneratedBannerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const customFileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial image source if official image changes
  useEffect(() => {
    if (officialImageSrc) {
      setSelectedImageSource('official');
    } else {
      setSelectedImageSource('original');
    }
  }, [officialImageSrc]);

  // Determine active raw source image
  const rawActiveImageSrc =
    selectedImageSource === 'custom' && customUploadedImage
      ? customUploadedImage
      : selectedImageSource === 'official' && officialImageSrc
      ? officialImageSrc
      : originalImageSrc;

  // Process high-precision edge-preserving background removal whenever active image changes
  useEffect(() => {
    let isCancelled = false;

    const processBg = async () => {
      if (!rawActiveImageSrc) {
        setProcessedTransparentSrc(null);
        setProductBBox(undefined);
        setBgSegmentationStatus(null);
        return;
      }

      setIsProcessingBg(true);
      setBgSegmentationStatus('Analyzing edges and pump details...');

      try {
        const res: SegmentationResult = await removeStudioBackground(rawActiveImageSrc, 26);
        if (!isCancelled) {
          if (res.success && res.transparentDataUrl && res.isHighQualityCutout) {
            setProcessedTransparentSrc(res.transparentDataUrl);
            setProductBBox(res.boundingBox);
            setPresentationMode('cutout');
            setBgSegmentationStatus('Clean studio cutout verified without pump distortion.');
          } else {
            // High quality fallback: Studio Panel so photo is never damaged or pixelated!
            setProcessedTransparentSrc(null);
            setProductBBox(res.boundingBox);
            setPresentationMode('studio-panel');
            setBgSegmentationStatus('Using Studio Panel to preserve 100% original packaging & edges.');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setProcessedTransparentSrc(null);
          setPresentationMode('studio-panel');
          setBgSegmentationStatus('Original photo preserved in Studio Panel.');
        }
      } finally {
        if (!isCancelled) {
          setIsProcessingBg(false);
        }
      }
    };

    processBg();

    return () => {
      isCancelled = true;
    };
  }, [rawActiveImageSrc]);

  // Re-composite banner whenever any setting or layer changes
  useEffect(() => {
    if (isOpen && !isProcessingBg && rawActiveImageSrc) {
      compositeLayeredBanner();
    }
  }, [
    isOpen,
    selectedBgId,
    selectedImageSource,
    presentationMode,
    processedTransparentSrc,
    rawActiveImageSrc,
    productScalePercent,
    productOffsetY,
    isProcessingBg,
  ]);

  const handleCustomUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result as string;
      setCustomUploadedImage(res);
      setSelectedImageSource('custom');
    };
    reader.readAsDataURL(file);
  };

  /**
   * TWO-COLUMN BALANCED ADVERTISEMENT PIPELINE (Strict 9:16 - 1080 × 1920)
   * Inspired by the Pure Skin reference ad:
   * - LEFT COLUMN: Large, clear product photograph prominently displayed (65–85% height).
   *   NO LARGE OVAL PLATFORM THAT OVERLAPS THE TITLE!
   * - RIGHT COLUMN: Product headline, English name, and 5–6 concise Urdu benefit cards.
   * - Crisp typography and vector framing.
   */
  const compositeLayeredBanner = async () => {
    setIsGenerating(true);
    setError(null);
    setDownloadSuccess(false);

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas element not initialized');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');

      // Strict 9:16 resolution: 1080 × 1920 pixels
      const WIDTH = 1080;
      const HEIGHT = 1920;
      canvas.width = WIDTH;
      canvas.height = HEIGHT;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // ----------------------------------------------------
      // LAYER 1: Generated Clean 9:16 Background (No bottle, no text)
      // ----------------------------------------------------
      const currentBg = BANNER_BACKGROUNDS.find((b) => b.id === selectedBgId) || BANNER_BACKGROUNDS[0];
      await drawBackgroundLayer(ctx, WIDTH, HEIGHT, currentBg);

      // ----------------------------------------------------
      // LAYER 2: Left Column Product Photograph (No Oval Overlap!)
      // ----------------------------------------------------
      const leftColX = 55;
      const leftColWidth = 445;
      const stageY = 220;
      const stageHeight = 1520;

      await drawLeftColumnProduct(ctx, leftColX, stageY, leftColWidth, stageHeight, currentBg);

      // ----------------------------------------------------
      // LAYER 3 & 4: Right Column Headline & 5-6 Urdu Benefit Cards
      // ----------------------------------------------------
      const rightColX = 525;
      const rightColWidth = 500;
      drawRightColumnContent(ctx, rightColX, stageY, rightColWidth, stageHeight, currentBg);

      // ----------------------------------------------------
      // LAYER 5: Luxury Framing, Crest & Verified Footer
      // ----------------------------------------------------
      drawFramingAndBranding(ctx, WIDTH, HEIGHT, currentBg);

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setGeneratedBannerUrl(dataUrl);
      setIsGenerating(false);
    } catch (err: any) {
      console.error('Banner composition failed:', err);
      setError(err?.message || 'Failed to composite advertising banner. Please retry.');
      setIsGenerating(false);
    }
  };

  /**
   * LAYER 1: Generated Clean 9:16 Background
   */
  const drawBackgroundLayer = async (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    bgOption: BannerBackgroundOption
  ) => {
    if (bgOption.type === 'ai-generated' && bgOption.src) {
      const loaded = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(true);
        };
        img.onerror = () => resolve(false);
        img.src = bgOption.src!;
      });

      if (loaded) {
        // Subtle soft vignette on right side to ensure crisp contrast for text cards
        const textVignette = ctx.createLinearGradient(w * 0.45, 0, w, 0);
        if (bgOption.themeStyle === 'aqua-fresh') {
          textVignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
          textVignette.addColorStop(0.5, 'rgba(235, 248, 252, 0.45)');
          textVignette.addColorStop(1, 'rgba(224, 242, 254, 0.75)');
        } else {
          textVignette.addColorStop(0, 'rgba(5, 5, 7, 0)');
          textVignette.addColorStop(0.5, 'rgba(5, 5, 7, 0.65)');
          textVignette.addColorStop(1, 'rgba(5, 5, 7, 0.92)');
        }
        ctx.fillStyle = textVignette;
        ctx.fillRect(w * 0.45, 0, w * 0.55, h);
        return;
      }
    }

    // Procedural Fallback
    ctx.fillStyle = bgOption.themeStyle === 'aqua-fresh' ? '#E0F2FE' : '#060608';
    ctx.fillRect(0, 0, w, h);
  };

  /**
   * LAYER 2: Left Column Product Photograph
   * Displays the product prominently (65%–85% of stage height).
   * NO LARGE OVAL PLATFORM THAT OVERLAPS THE TITLE!
   */
  const drawLeftColumnProduct = async (
    ctx: CanvasRenderingContext2D,
    colX: number,
    colY: number,
    colWidth: number,
    colHeight: number,
    currentBg: BannerBackgroundOption
  ) => {
    ctx.save();

    const centerX = colX + colWidth / 2;
    const centerY = colY + colHeight * 0.48 + productOffsetY;
    const targetHeight = Math.round(colHeight * (productScalePercent / 100));

    // Ambient radial glow behind product
    const auraColor =
      currentBg.themeStyle === 'aqua-fresh'
        ? 'rgba(6, 182, 212, 0.25)'
        : currentBg.themeStyle === 'royal-emerald'
        ? 'rgba(16, 185, 129, 0.25)'
        : 'rgba(212, 175, 55, 0.28)';

    const auraGrad = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, targetHeight * 0.45);
    auraGrad.addColorStop(0, auraColor);
    auraGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.04)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, targetHeight * 0.45, 0, Math.PI * 2);
    ctx.fill();

    const effectiveSrc =
      presentationMode === 'cutout' && processedTransparentSrc
        ? processedTransparentSrc
        : rawActiveImageSrc;

    if (effectiveSrc) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          const natW = img.naturalWidth || 400;
          const natH = img.naturalHeight || 500;

          // Bounding-box trimming in cutout mode prevents tiny bottles from massive photo margins!
          const useCrop = presentationMode === 'cutout' && productBBox && productBBox.width > 20 && productBBox.height > 20;
          const srcX = useCrop ? productBBox!.minX : 0;
          const srcY = useCrop ? productBBox!.minY : 0;
          const srcW = useCrop ? productBBox!.width : natW;
          const srcH = useCrop ? productBBox!.height : natH;

          // Proportional scaling preserving exact product aspect ratio without stretching
          const scale = Math.min(colWidth / srcW, targetHeight / srcH);
          const drawW = Math.round(srcW * scale);
          const drawH = Math.round(srcH * scale);

          const drawX = Math.round(centerX - drawW / 2);
          const drawY = Math.round(centerY - drawH / 2);

          if (presentationMode === 'cutout' && processedTransparentSrc) {
            // MODE A: CLEAN TRANSPARENT CUTOUT
            // Natural contact drop shadow underneath base (NO OVERLAPPING OVAL PLATFORM!)
            const shadowY = drawY + drawH - 6;
            const shadowRadiusX = Math.round(drawW * 0.44);
            const shadowRadiusY = 16;

            const shadowGrad = ctx.createRadialGradient(centerX, shadowY, 0, centerX, shadowY, shadowRadiusX);
            shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
            shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.22)');
            shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.ellipse(centerX, shadowY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
            ctx.fillStyle = shadowGrad;
            ctx.fill();

            // Product drop shadow
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 24;
            ctx.shadowOffsetY = 14;
            ctx.drawImage(img, srcX, srcY, srcW, srcH, drawX, drawY, drawW, drawH);
            ctx.restore();
          } else {
            // MODE B: STUDIO PRESENTATION PANEL (100% original photo with zero cutout damage!)
            const pad = 14;
            const cardX = drawX - pad;
            const cardY = drawY - pad;
            const cardW = drawW + pad * 2;
            const cardH = drawH + pad * 2;

            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 16;

            // Panel background
            ctx.fillStyle = currentBg.themeStyle === 'aqua-fresh' ? '#FFFFFF' : '#141416';
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 22);
            ctx.fill();
            ctx.restore();

            // Panel accent border
            ctx.strokeStyle = currentBg.accentColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 22);
            ctx.stroke();

            // Clip photo inside panel
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(cardX + 3, cardY + 3, cardW - 6, cardH - 6, 19);
            ctx.clip();
            ctx.drawImage(img, 0, 0, natW, natH, drawX, drawY, drawW, drawH);
            ctx.restore();
          }

          resolve();
        };

        img.onerror = () => resolve();
        img.src = effectiveSrc;
      });
    }

    ctx.restore();
  };

  /**
   * LAYER 3 & 4: Right Column Product Headline & 5-6 Urdu Benefit Cards
   */
  const drawRightColumnContent = (
    ctx: CanvasRenderingContext2D,
    colX: number,
    colY: number,
    colWidth: number,
    colHeight: number,
    currentBg: BannerBackgroundOption
  ) => {
    ctx.save();

    const isLightBg = currentBg.themeStyle === 'aqua-fresh';
    const rightEdge = colX + colWidth - 20;

    // 1. English Product Name & Code Tag
    ctx.textAlign = 'right';
    const engName = data.detectedDetails.productNameEnglish || 'ORIFLAME PRODUCT';
    ctx.fillStyle = isLightBg ? '#0F172A' : '#FFFFFF';
    ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '0.5px';
    const nameText = engName.length > 34 ? engName.substring(0, 32) + '...' : engName;
    ctx.fillText(nameText.toUpperCase(), rightEdge, colY + 36);

    // Product Code Badge
    const code = data.detectedDetails.productCode;
    if (code && code !== 'Not visible / فراہم نہیں') {
      const codeText = `CODE: ${code}`;
      ctx.font = '700 16px monospace';
      const textMetrics = ctx.measureText(codeText);
      const bgW = textMetrics.width + 26;
      const bgH = 26;

      ctx.fillStyle = isLightBg ? 'rgba(6, 182, 212, 0.15)' : 'rgba(212, 175, 55, 0.15)';
      ctx.strokeStyle = currentBg.accentColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(rightEdge - bgW, colY + 48, bgW, bgH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = currentBg.accentColor;
      ctx.fillText(codeText, rightEdge - 13, colY + 66);
    }

    // 2. Urdu Headline
    const headlineY = colY + (code ? 120 : 90);
    ctx.direction = 'rtl';
    ctx.fillStyle = isLightBg ? '#0891B2' : currentBg.accentColor;
    ctx.font = '700 32px "Noto Nastaliq Urdu", Tahoma, sans-serif';
    ctx.fillText(data.urduContent.productNameUrdu || 'اہم فوائد اور خصوصیات', rightEdge, headlineY);

    // Accent line below headline
    const lineLen = 280;
    const grad = ctx.createLinearGradient(rightEdge, 0, rightEdge - lineLen, 0);
    grad.addColorStop(0, currentBg.accentColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rightEdge, headlineY + 16);
    ctx.lineTo(rightEdge - lineLen, headlineY + 16);
    ctx.stroke();

    // 3. 5 to 6 Concise Urdu Benefit Cards
    const points = (data.urduContent.benefits || []).slice(0, 6);
    const startCardsY = headlineY + 45;
    const availableCardHeight = colHeight - (startCardsY - colY) - 40;
    const cardGap = 20;
    const cardHeight = Math.min(175, Math.floor((availableCardHeight - (points.length - 1) * cardGap) / Math.max(points.length, 1)));

    const cardIcons = ['💧', '✨', '🌿', '🛡️', '🌸', '🎯'];

    points.forEach((benefit, index) => {
      const cardY = startCardsY + index * (cardHeight + cardGap);
      const cardX = colX;
      const cardW = colWidth;

      // Card Background
      ctx.save();
      ctx.fillStyle = isLightBg ? 'rgba(255, 255, 255, 0.94)' : 'rgba(18, 18, 22, 0.92)';
      ctx.shadowColor = isLightBg ? 'rgba(6, 182, 212, 0.12)' : 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardHeight, 16);
      ctx.fill();
      ctx.restore();

      // Card border
      ctx.strokeStyle = isLightBg ? 'rgba(6, 182, 212, 0.28)' : 'rgba(212, 175, 55, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardHeight, 16);
      ctx.stroke();

      // Left Icon Badge
      const iconX = cardX + 36;
      const iconY = cardY + cardHeight / 2;
      ctx.beginPath();
      ctx.arc(iconX, iconY, 20, 0, Math.PI * 2);
      ctx.fillStyle = isLightBg ? 'rgba(6, 182, 212, 0.15)' : 'rgba(212, 175, 55, 0.15)';
      ctx.fill();
      ctx.strokeStyle = currentBg.accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.direction = 'ltr';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(cardIcons[index % cardIcons.length], iconX, iconY + 6);

      // Benefit text in authentic Urdu
      ctx.textAlign = 'right';
      ctx.direction = 'rtl';
      ctx.font = '500 23px "Noto Nastaliq Urdu", Tahoma, sans-serif';
      ctx.fillStyle = isLightBg ? '#0F172A' : '#F4F4F5';

      const textRightEdge = cardX + cardW - 65;
      const maxTextW = cardW - 85;
      const textToDraw = benefit.trim();

      if (ctx.measureText(textToDraw).width < maxTextW) {
        ctx.fillText(textToDraw, textRightEdge, cardY + cardHeight / 2 + 8);
      } else {
        const words = textToDraw.split(' ');
        let line1 = '';
        let line2 = '';
        for (let w = 0; w < words.length; w++) {
          const test = line1 ? `${line1} ${words[w]}` : words[w];
          if (ctx.measureText(test).width < maxTextW) {
            line1 = test;
          } else {
            line2 = words.slice(w).join(' ');
            break;
          }
        }
        ctx.fillText(line1, textRightEdge, cardY + cardHeight / 2 - 8);
        if (line2) {
          ctx.font = '500 20px "Noto Nastaliq Urdu", Tahoma, sans-serif';
          ctx.fillStyle = isLightBg ? '#334155' : '#E2E8F0';
          ctx.fillText(line2, textRightEdge, cardY + cardHeight / 2 + 24);
        }
      }
    });

    ctx.restore();
  };

  /**
   * LAYER 5: Luxury Framing, Crest & Verified Footer
   */
  const drawFramingAndBranding = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    currentBg: BannerBackgroundOption
  ) => {
    ctx.save();

    const isLightBg = currentBg.themeStyle === 'aqua-fresh';

    // Outer double border
    ctx.strokeStyle = `${currentBg.accentColor}55`;
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, w - 64, h - 64);

    ctx.strokeStyle = currentBg.accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(42, 42, w - 84, h - 84);

    // Corner brackets
    const bSize = 36;
    const corners = [
      { x: 32, y: 32, dx: 1, dy: 1 },
      { x: w - 32, y: 32, dx: -1, dy: 1 },
      { x: 32, y: h - 32, dx: 1, dy: -1 },
      { x: w - 32, y: h - 32, dx: -1, dy: -1 },
    ];
    ctx.strokeStyle = currentBg.accentColor;
    ctx.lineWidth = 4;
    corners.forEach((c) => {
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.dy * bSize);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x + c.dx * bSize, c.y);
      ctx.stroke();
    });

    // Top Header
    ctx.textAlign = 'center';
    ctx.direction = 'ltr';
    ctx.fillStyle = currentBg.accentColor;
    ctx.font = '700 18px "Cinzel", Georgia, serif';
    ctx.letterSpacing = '5px';
    ctx.fillText('• SWEDISH BEAUTY & WELLNESS •', w / 2, 85);

    ctx.font = '800 40px "Cinzel", Georgia, serif';
    ctx.fillStyle = isLightBg ? '#0891B2' : '#FFFFFF';
    ctx.letterSpacing = '6px';
    ctx.fillText('ORIFLAME SWEDEN', w / 2, 135);

    const divW = 240;
    const grad = ctx.createLinearGradient(w / 2 - divW / 2, 0, w / 2 + divW / 2, 0);
    grad.addColorStop(0, 'rgba(212, 175, 55, 0)');
    grad.addColorStop(0.5, currentBg.accentColor);
    grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - divW / 2, 155);
    ctx.lineTo(w / 2 + divW / 2, 155);
    ctx.stroke();

    // Footer
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, h - 70);
    ctx.lineTo(w - 80, h - 70);
    ctx.stroke();

    ctx.fillStyle = isLightBg ? '#475569' : '#A1A1AA';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('100% GENUINE ORIFLAME SWEDEN  •  VERIFIED PRODUCT ADVERTISEMENT', w / 2, h - 44);

    ctx.restore();
  };

  const handleDownload = () => {
    if (!generatedBannerUrl) return;
    const link = document.createElement('a');
    const safeName = (data.detectedDetails.productNameEnglish || 'oriflame-product')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    link.download = `zk-oriflame-${safeName}-ad-banner-9x16.png`;
    link.href = generatedBannerUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#121214] border border-stone-800 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-[#16161a]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-stone-950 font-black font-serif shadow-lg shadow-amber-500/20">
              ZK
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase font-mono">
                  9:16 VERTICAL BANNER STUDIO
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                  Two-Column Pure Skin Layout
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Generate Advertising Banner
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Canvas for High-Resolution Compositing (1080 × 1920) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PREVIEW COLUMN (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-4">
            <div className="w-full max-w-[340px] aspect-[9/16] rounded-2xl bg-stone-950 border border-stone-800 shadow-2xl overflow-hidden relative flex items-center justify-center group">
              {isGenerating || isProcessingBg ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/80 backdrop-blur-xs p-6 text-center space-y-3 z-20">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="text-sm font-semibold text-white">
                    {isProcessingBg ? 'Preserving Fine Edges & Pump...' : 'Compositing High-Res 9:16 Banner...'}
                  </p>
                  <p className="text-xs text-stone-400">
                    Rendering vector typography and clean layer separation
                  </p>
                </div>
              ) : null}

              {generatedBannerUrl ? (
                <img
                  src={generatedBannerUrl}
                  alt="Composited 9:16 Oriflame Ad Banner"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-stone-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Preparing banner canvas...</p>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30">
                1080 × 1920 • 9:16
              </div>
            </div>

            {/* Quick Download Button below preview */}
            <button
              onClick={handleDownload}
              disabled={!generatedBannerUrl || isGenerating}
              className="w-full max-w-[340px] py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-stone-950 font-bold text-sm shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-stone-950" />
                  <span>Banner Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-stone-950" />
                  <span>Download 9:16 Banner (PNG)</span>
                </>
              )}
            </button>
          </div>

          {/* RIGHT CONTROLS COLUMN (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Image Source Selection */}
            <div className="bg-[#18181b] p-4 rounded-2xl border border-stone-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Product Image Layer</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {officialImageSrc && (
                  <button
                    type="button"
                    onClick={() => setSelectedImageSource('official')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      selectedImageSource === 'official'
                        ? 'bg-amber-500/10 border-amber-400 text-white'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <img
                      src={officialImageSrc}
                      alt="Official Packshot"
                      className="w-10 h-10 object-contain rounded-lg bg-stone-950 p-1 border border-stone-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                        <span>Official Studio Packshot</span>
                        <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      </div>
                      <div className="text-[11px] text-stone-400">media-cdn.oriflame.com</div>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedImageSource('original')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    selectedImageSource === 'original'
                      ? 'bg-amber-500/10 border-amber-400 text-white'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  {originalImageSrc ? (
                    <img
                      src={originalImageSrc}
                      alt="Original Upload"
                      className="w-10 h-10 object-contain rounded-lg bg-stone-950 p-1 border border-stone-800 shrink-0"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-stone-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Original Uploaded Photo</div>
                    <div className="text-[11px] text-stone-400">100% unaltered product source</div>
                  </div>
                </button>
              </div>

              {/* Upload custom packshot */}
              <div className="pt-1">
                <input
                  ref={customFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCustomUpload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => customFileInputRef.current?.click()}
                  className="text-xs text-stone-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Or upload a different product packshot for this banner</span>
                </button>
              </div>
            </div>

            {/* 2. Presentation Mode: Clean Cutout vs Studio Panel */}
            <div className="bg-[#18181b] p-4 rounded-2xl border border-stone-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Edge & Packaging Preservation</span>
                </span>
                <span className="text-[11px] font-normal text-stone-400 normal-case">
                  {presentationMode === 'cutout' ? 'Studio Cutout Active' : 'Studio Panel Active'}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPresentationMode('cutout')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    presentationMode === 'cutout'
                      ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-center gap-1.5">
                    <span>✂️ Clean Studio Cutout</span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-1">
                    Transparent cutout with soft natural base shadow
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPresentationMode('studio-panel')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    presentationMode === 'studio-panel'
                      ? 'bg-amber-500/10 border-amber-400 text-white shadow-sm'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-center gap-1.5">
                    <span>🖼️ Studio Presentation Panel</span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-1">
                    Luxury bordered card preserving 100% original photo
                  </div>
                </button>
              </div>

              {bgSegmentationStatus && (
                <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800 text-[11px] text-stone-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{bgSegmentationStatus}</span>
                </div>
              )}
            </div>

            {/* 3. Background Theme Selection */}
            <div className="bg-[#18181b] p-4 rounded-2xl border border-stone-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>9:16 Advertising Background</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BANNER_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setSelectedBgId(bg.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedBgId === bg.id
                        ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: bg.accentColor }}
                      />
                      <span className="text-xs font-bold text-white truncate">{bg.name}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 line-clamp-1">{bg.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Fine-Tuning Sliders: Scale & Position */}
            <div className="bg-[#18181b] p-4 rounded-2xl border border-stone-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Product Sizing & Alignment</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-stone-300">
                    <span>Product Scale</span>
                    <span className="font-mono text-amber-400">{productScalePercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="55"
                    max="88"
                    value={productScalePercent}
                    onChange={(e) => setProductScalePercent(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-stone-300">
                    <span>Vertical Position</span>
                    <span className="font-mono text-amber-400">{productOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    value={productOffsetY}
                    onChange={(e) => setProductOffsetY(parseInt(e.target.value, 10))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!generatedBannerUrl || isGenerating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:scale-[1.01] transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Banner (PNG)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
