import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Download,
  Edit3,
  RefreshCw,
  PlusCircle,
  X,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Tag,
  Scissors,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layout,
  Droplet,
} from 'lucide-react';
import { MASTER_PROMPT } from '../constants/masterPrompt';
import { BANNER_BACKGROUNDS, BannerBackgroundOption } from '../data/bannerBackgrounds';
import { removeStudioBackground, SegmentationResult, BoundingBox } from '../utils/imageProcessor';
import { SAMPLE_PRODUCTS, generateSampleDataUrl } from '../data/samples';

interface ParsedBenefitsData {
  urduHeadline: string;
  productName: string;
  productCode: string;
  benefits: string[];
  rawExtractedText?: string;
  confidence?: string;
}

type PresentationMode = 'cutout' | 'studio-panel';

export const BannerStudioPage: React.FC = () => {
  // Step 1: User Inputs
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productImageMeta, setProductImageMeta] = useState<string | null>(null);

  // Benefits Inputs
  const [benefitsText, setBenefitsText] = useState<string>('');
  const [benefitsImage, setBenefitsImage] = useState<string | null>(null);
  const [isParsingBenefits, setIsParsingBenefits] = useState<boolean>(false);
  const [benefitsError, setBenefitsError] = useState<string | null>(null);

  // Optional Product Identifiers
  const [optionalProductName, setOptionalProductName] = useState<string>('');
  const [optionalProductCode, setOptionalProductCode] = useState<string>('');
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);

  // Step 2: Composited Banner State
  const [isCompositing, setIsCompositing] = useState<boolean>(false);
  const [generatedBannerUrl, setGeneratedBannerUrl] = useState<string | null>(null);
  const [activeBenefitsData, setActiveBenefitsData] = useState<ParsedBenefitsData | null>(null);

  // Background Selection (Layer 1) - Default to Pure Skin Aqua Fresh for modern skincare ad style
  const [selectedBgId, setSelectedBgId] = useState<string>('ai-pureskin-aqua');

  // Product Layer Controls (Layer 2)
  const [presentationMode, setPresentationMode] = useState<PresentationMode>('cutout');
  const [processedTransparentSrc, setProcessedTransparentSrc] = useState<string | null>(null);
  const [productBBox, setProductBBox] = useState<BoundingBox | undefined>(undefined);
  const [isProcessingBg, setIsProcessingBg] = useState<boolean>(false);
  const [bgSegmentationStatus, setBgSegmentationStatus] = useState<string | null>(null);
  const [productScalePercent, setProductScalePercent] = useState<number>(75); // 60% to 88% of column height
  const [productOffsetY, setProductOffsetY] = useState<number>(0);

  // Edit Benefits Modal state
  const [isEditingBenefits, setIsEditingBenefits] = useState<boolean>(false);
  const [editableHeadline, setEditableHeadline] = useState<string>('');
  const [editableBenefitsList, setEditableBenefitsList] = useState<string[]>([]);

  // Feedback
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Refs
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const benefitsFileInputRef = useRef<HTMLInputElement>(null);
  const benefitsImageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // High-precision background removal whenever product photo changes
  useEffect(() => {
    let isCancelled = false;

    const processBg = async () => {
      if (!productImage) {
        setProcessedTransparentSrc(null);
        setProductBBox(undefined);
        setBgSegmentationStatus(null);
        return;
      }

      setIsProcessingBg(true);
      setBgSegmentationStatus('Analyzing edges and pump details...');

      try {
        const res: SegmentationResult = await removeStudioBackground(productImage, 26);
        if (!isCancelled) {
          if (res.success && res.transparentDataUrl && res.isHighQualityCutout) {
            setProcessedTransparentSrc(res.transparentDataUrl);
            setProductBBox(res.boundingBox);
            setPresentationMode('cutout');
            setBgSegmentationStatus('Clean studio cutout verified without pump distortion.');
          } else {
            // Safe fallback: use studio presentation panel so photo is never damaged!
            setProcessedTransparentSrc(null);
            setProductBBox(res.boundingBox);
            setPresentationMode('studio-panel');
            setBgSegmentationStatus('Using elegant Studio Panel to preserve 100% original edges.');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setProcessedTransparentSrc(null);
          setPresentationMode('studio-panel');
          setBgSegmentationStatus('Original photo preserved inside Studio Panel.');
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
  }, [productImage]);

  // Handle Product Image Upload
  const handleProductImageFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setProductImage(e.target?.result as string);
      setProductImageMeta(`${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
    };
    reader.readAsDataURL(file);
  };

  // Quick Sample Picker
  const handlePickSample = (sampleId: string) => {
    const s = SAMPLE_PRODUCTS.find((p) => p.id === sampleId);
    if (!s) return;
    const dataUrl = generateSampleDataUrl(s);
    setProductImage(dataUrl);
    setProductImageMeta(`${s.name} (Sample Asset)`);
    setOptionalProductName(s.name);
    setOptionalProductCode(s.code);

    if (s.id.includes('pureskin') || s.name.toLowerCase().includes('tea tree') || s.name.toLowerCase().includes('hydra')) {
      setSelectedBgId('ai-pureskin-aqua');
    } else {
      setSelectedBgId('ai-black-gold');
    }
  };

  // Handle Benefits Text File Upload (.txt)
  const handleBenefitsTextFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setBenefitsText(text);
      setBenefitsImage(null);
    };
    reader.readAsText(file);
  };

  // Handle Benefits Image Upload (Brochure / packaging image containing text)
  const handleBenefitsImageFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setBenefitsImage(base64);
      processBenefitsFromImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Call server to parse image benefits
  const processBenefitsFromImage = async (base64: string, mimeType: string) => {
    setIsParsingBenefits(true);
    setBenefitsError(null);
    try {
      const res = await fetch('/api/parse-benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          productName: optionalProductName,
          productCode: optionalProductCode,
        }),
      });
      const data = await res.json();
      if (data.success && data.benefits && data.benefits.length > 0) {
        setBenefitsText(data.benefits.join('\n'));
        if (data.productName && !optionalProductName) setOptionalProductName(data.productName);
        if (data.productCode && !optionalProductCode) setOptionalProductCode(data.productCode);
      } else {
        setBenefitsError(data.message || 'Could not detect clear benefits in this image. Please paste text directly.');
      }
    } catch (e: any) {
      setBenefitsError('Failed to process benefits image. Please paste or enter the benefits text.');
    } finally {
      setIsParsingBenefits(false);
    }
  };

  // Main Action: Generate Banner
  const handleGenerateBanner = async () => {
    if (!productImage) {
      alert('Please upload a product image first.');
      return;
    }

    if (!benefitsText.trim() && !benefitsImage) {
      alert('Please enter product benefits or upload a benefits document/image.');
      return;
    }

    setIsCompositing(true);
    setBenefitsError(null);

    try {
      let parsedData: ParsedBenefitsData;

      const res = await fetch('/api/parse-benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: benefitsText.trim(),
          imageBase64: benefitsImage || undefined,
          productName: optionalProductName,
          productCode: optionalProductCode,
        }),
      });

      const responseData = await res.json();

      if (responseData.success && responseData.benefits) {
        parsedData = {
          urduHeadline: responseData.urduHeadline || 'اہم فوائد اور خصوصیات',
          productName: optionalProductName || responseData.productName || 'ORIFLAME PRODUCT',
          productCode: optionalProductCode || responseData.productCode || '',
          benefits: responseData.benefits,
          rawExtractedText: responseData.rawExtractedText,
          confidence: responseData.confidence,
        };
      } else {
        const lines = benefitsText
          .split('\n')
          .map((l) => l.trim().replace(/^[•\-\*\d\.]+\s*/, ''))
          .filter((l) => l.length > 3);

        parsedData = {
          urduHeadline: 'اہم فوائد اور خصوصیات',
          productName: optionalProductName || 'ORIFLAME PRODUCT',
          productCode: optionalProductCode || '',
          benefits: lines.length > 0 ? lines : ['جلد کو گہری نمی اور قدرتی چمک فراہم کرتا ہے'],
        };
      }

      setActiveBenefitsData(parsedData);
      setEditableHeadline(parsedData.urduHeadline);
      setEditableBenefitsList(parsedData.benefits);

      await renderTwoColumnBanner(parsedData, selectedBgId);
    } catch (err: any) {
      console.error('Error generating banner:', err);
      setBenefitsError('Failed to composite banner. Please verify benefits and try again.');
    } finally {
      setIsCompositing(false);
    }
  };

  /**
   * TWO-COLUMN BALANCED ADVERTISEMENT PIPELINE (Strict 9:16 - 1080 × 1920)
   * Inspired by the Pure Skin reference ad:
   * - LEFT COLUMN: Large, clear product photograph prominently displayed. NO LARGE OVAL PLATFORM!
   * - RIGHT COLUMN: Product headline, English name, and 5–6 concise Urdu benefit cards.
   * - Strict layer separation, high-resolution rendering, zero text clipping.
   */
  const renderTwoColumnBanner = async (
    bData: ParsedBenefitsData,
    bgId: string
  ) => {
    if (document.fonts) {
      await document.fonts.ready;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const WIDTH = 1080;
    const HEIGHT = 1920;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // ----------------------------------------------------
    // LAYER 1: Generated Clean 9:16 Background
    // ----------------------------------------------------
    const currentBg = BANNER_BACKGROUNDS.find((b) => b.id === bgId) || BANNER_BACKGROUNDS[0];
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
    drawRightColumnContent(ctx, rightColX, stageY, rightColWidth, stageHeight, bData, currentBg);

    // ----------------------------------------------------
    // LAYER 5: Framing, Brand Crest & Verified Footer
    // ----------------------------------------------------
    drawFramingAndBranding(ctx, WIDTH, HEIGHT, currentBg);

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setGeneratedBannerUrl(dataUrl);
  };

  // Live real-time re-render when sliders, background, or presentation mode change
  useEffect(() => {
    if (activeBenefitsData && generatedBannerUrl) {
      renderTwoColumnBanner(activeBenefitsData, selectedBgId);
    }
  }, [
    selectedBgId,
    presentationMode,
    processedTransparentSrc,
    productScalePercent,
    productOffsetY,
  ]);

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
   * LEFT COLUMN: Product Photograph
   * Displays the actual product prominently (60–80% of column height).
   * REMOVED THE LARGE OVAL PLATFORM that crossed the product title!
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
    const targetHeight = Math.round(colHeight * (productScalePercent / 100)); // ~950-1200px!

    // Soft ambient glow behind product
    const auraColor =
      currentBg.themeStyle === 'aqua-fresh'
        ? 'rgba(6, 182, 212, 0.25)'
        : currentBg.themeStyle === 'royal-emerald'
        ? 'rgba(16, 185, 129, 0.25)'
        : 'rgba(212, 175, 55, 0.28)';

    const auraGrad = ctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, targetHeight * 0.44);
    auraGrad.addColorStop(0, auraColor);
    auraGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.04)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, targetHeight * 0.44, 0, Math.PI * 2);
    ctx.fill();

    const effectiveSrc =
      presentationMode === 'cutout' && processedTransparentSrc
        ? processedTransparentSrc
        : productImage;

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
            // MODE A: CLEAN CUTOUT
            // Soft natural contact shadow underneath base (NO LARGE OVAL PLATFORM!)
            const shadowY = drawY + drawH - 8;
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

            // Subtle panel border
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
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
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
   * RIGHT COLUMN: Product Headline & 5-6 Benefit Cards
   * Beautifully stacked with generous vertical spacing, icons, and RTL Urdu text
   */
  const drawRightColumnContent = (
    ctx: CanvasRenderingContext2D,
    colX: number,
    colY: number,
    colWidth: number,
    colHeight: number,
    bData: ParsedBenefitsData,
    currentBg: BannerBackgroundOption
  ) => {
    ctx.save();

    const isLightBg = currentBg.themeStyle === 'aqua-fresh';
    const rightEdge = colX + colWidth - 20;

    // 1. English Product Name & Code Tag
    ctx.textAlign = 'right';
    if (bData.productName) {
      ctx.fillStyle = isLightBg ? '#0F172A' : '#FFFFFF';
      ctx.font = '800 28px "Plus Jakarta Sans", sans-serif';
      ctx.letterSpacing = '0.5px';
      const nameText =
        bData.productName.length > 34 ? bData.productName.substring(0, 32) + '...' : bData.productName;
      ctx.fillText(nameText.toUpperCase(), rightEdge, colY + 36);
    }

    if (bData.productCode) {
      const codeText = `CODE: ${bData.productCode}`;
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
    const headlineY = colY + (bData.productCode ? 120 : 90);
    ctx.direction = 'rtl';
    ctx.fillStyle = isLightBg ? '#0891B2' : currentBg.accentColor;
    ctx.font = '700 32px "Noto Nastaliq Urdu", Tahoma, sans-serif';
    ctx.fillText(bData.urduHeadline || 'اہم فوائد اور خصوصیات', rightEdge, headlineY);

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

    // 3. 5 or 6 Concise Urdu Benefit Cards (Stacking in available height)
    const points = (bData.benefits || []).slice(0, 6);
    const startCardsY = headlineY + 45;
    const availableCardHeight = colHeight - (startCardsY - colY) - 40;
    const cardGap = 20;
    const cardHeight = Math.min(175, Math.floor((availableCardHeight - (points.length - 1) * cardGap) / points.length));

    // Category / function icon symbols for cards
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
      ctx.roundRect(cardX, cardY, cardW, cardHeight, 18);
      ctx.fill();
      ctx.restore();

      // Card Border
      ctx.strokeStyle = isLightBg ? 'rgba(6, 182, 212, 0.35)' : `${currentBg.accentColor}44`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardHeight, 18);
      ctx.stroke();

      // Small Icon Badge on the right
      const iconX = cardX + cardW - 32;
      const iconY = cardY + cardHeight / 2;

      ctx.beginPath();
      ctx.arc(iconX, iconY, 18, 0, Math.PI * 2);
      ctx.fillStyle = isLightBg ? 'rgba(6, 182, 212, 0.12)' : `${currentBg.accentColor}22`;
      ctx.fill();
      ctx.strokeStyle = currentBg.accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Number / Icon Symbol
      ctx.textAlign = 'center';
      ctx.direction = 'ltr';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(cardIcons[index % cardIcons.length], iconX, iconY + 6);

      // Benefit text in authentic Pakistani Urdu
      ctx.textAlign = 'right';
      ctx.direction = 'rtl';
      ctx.font = '500 23px "Noto Nastaliq Urdu", Tahoma, sans-serif';
      ctx.fillStyle = isLightBg ? '#0F172A' : '#F4F4F5';

      const textRightEdge = cardX + cardW - 65;
      const maxTextW = cardW - 85;
      const textToDraw = benefit.trim();

      // Check single-line vs multi-line
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
    const safeName = (optionalProductName || 'oriflame-product').toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.download = `zk-oriflame-${safeName}-ad-banner-9x16.png`;
    link.href = generatedBannerUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleRegenerateBackgroundOnly = () => {
    const currentIndex = BANNER_BACKGROUNDS.findIndex((b) => b.id === selectedBgId);
    const nextIndex = (currentIndex + 1) % BANNER_BACKGROUNDS.length;
    const nextBg = BANNER_BACKGROUNDS[nextIndex];
    setSelectedBgId(nextBg.id);
    if (activeBenefitsData) {
      renderTwoColumnBanner(activeBenefitsData, nextBg.id);
    }
  };

  const handleSaveEditedBenefits = () => {
    if (!activeBenefitsData) return;
    const updated: ParsedBenefitsData = {
      ...activeBenefitsData,
      urduHeadline: editableHeadline,
      benefits: editableBenefitsList.filter((b) => b.trim().length > 0),
    };
    setActiveBenefitsData(updated);
    setIsEditingBenefits(false);
    renderTwoColumnBanner(updated, selectedBgId);
  };

  const handleStartNewBanner = () => {
    setGeneratedBannerUrl(null);
    setActiveBenefitsData(null);
    setProductImage(null);
    setProductImageMeta(null);
    setBenefitsText('');
    setBenefitsImage(null);
    setOptionalProductName('');
    setOptionalProductCode('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16 animate-fade-in text-stone-100">
      {/* Title Header */}
      <div className="bg-[#121214] rounded-3xl p-6 sm:p-7 border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Two-Column Advertising Studio • 9:16 Vertical</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Generate Oriflame Advertising Banner
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 max-w-xl leading-relaxed">
              Creates a professional commercial layout inspired by official Oriflame campaigns: exact un-altered product hero shot on the left, Urdu headline and 5–6 benefit cards on the right.
            </p>
          </div>

          <div className="shrink-0 flex items-center">
            <span className="text-xs bg-stone-900 border border-cyan-500/30 text-cyan-300 px-3.5 py-2 rounded-xl font-medium shadow-xs">
              ✓ Exact Bottle Preserved
            </span>
          </div>
        </div>
      </div>

      {/* Hidden Canvas for High-Resolution Compositing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* VIEW A: Simple Input Form (When no banner is generated yet) */}
      {!generatedBannerUrl && (
        <div className="bg-[#121214] rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-xl space-y-7">
          {/* INPUT 1: Upload Product Image (Required) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-500 text-stone-950 flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>Upload Product Image (Required)</span>
              </label>
              {productImage && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Image Attached
                </span>
              )}
            </div>

            {!productImage ? (
              <div
                onClick={() => productImageInputRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-stone-800 hover:border-cyan-500/50 bg-[#18181b]/70 hover:bg-[#18181b] p-7 text-center cursor-pointer transition-all space-y-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-stone-900 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Click to browse or drop Oriflame product photo
                  </p>
                  <p className="text-xs text-stone-500">Supports JPG, PNG, and WEBP formats</p>
                </div>
                <input
                  type="file"
                  ref={productImageInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleProductImageFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#18181b] border border-stone-800">
                <div className="flex items-center space-x-3.5">
                  <div className="w-16 h-16 rounded-xl bg-black/50 border border-stone-800 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={productImage} alt="Product" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-xs">{productImageMeta || 'Product Image'}</p>
                    <p className="text-[11px] text-cyan-400">{bgSegmentationStatus || 'Ready for composition'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProductImage(null)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Change
                </button>
              </div>
            )}

            {/* Quick Test Chips */}
            {!productImage && (
              <div className="flex items-center flex-wrap gap-2 pt-1 text-xs text-stone-400">
                <span className="text-[11px] text-stone-500">Or test sample:</span>
                <button
                  type="button"
                  onClick={() => handlePickSample('sample-pure-skin')}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-cyan-500/30 text-cyan-300 transition-colors"
                >
                  Pure Skin Toner (Aqua)
                </button>
                <button
                  type="button"
                  onClick={() => handlePickSample('sample-tender-care')}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 transition-colors"
                >
                  Tender Care Balm
                </button>
                <button
                  type="button"
                  onClick={() => handlePickSample('sample-milk-honey')}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 transition-colors"
                >
                  Milk & Honey Scrub
                </button>
              </div>
            )}
          </div>

          {/* INPUT 2: Upload or Enter Product Benefits (Required) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-500 text-stone-950 flex items-center justify-center text-xs font-black">
                  2
                </span>
                <span>Upload or Enter Product Benefits (Required)</span>
              </label>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => benefitsFileInputRef.current?.click()}
                  className="text-xs px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload .TXT</span>
                </button>
                <button
                  type="button"
                  onClick={() => benefitsImageInputRef.current?.click()}
                  className="text-xs px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 flex items-center gap-1 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Image (OCR)</span>
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={benefitsFileInputRef}
              accept=".txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleBenefitsTextFile(e.target.files[0])}
            />
            <input
              type="file"
              ref={benefitsImageInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleBenefitsImageFile(e.target.files[0])}
            />

            {isParsingBenefits && (
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2.5 text-xs text-cyan-300 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Reading benefits from uploaded image using vision model...</span>
              </div>
            )}

            {benefitsError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{benefitsError}</span>
              </div>
            )}

            <textarea
              value={benefitsText}
              onChange={(e) => setBenefitsText(e.target.value)}
              placeholder="Paste or type product benefits here (English or Urdu)...&#10;Example:&#10;• Cleanses deeply and removes excess shine&#10;• Targets spots and unclogs pores with Salicylic Acid&#10;• Soothing pomegranate extract calms irritated skin&#10;• Leaves skin refreshed, matte, and clear"
              rows={5}
              className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-stone-800 bg-stone-900 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 shadow-inner"
            />
          </div>

          {/* Optional Product Identifiers */}
          <div className="bg-[#18181b] rounded-2xl p-4 border border-stone-800">
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-stone-300 hover:text-white"
            >
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                Optional: Product Name or 5-Digit Code
              </span>
              {showOptionalFields ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
            </button>

            {showOptionalFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <input
                  type="text"
                  value={optionalProductName}
                  onChange={(e) => setOptionalProductName(e.target.value)}
                  placeholder="Product Name (e.g. Pure Skin Purifying Face Wash)"
                  className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-900 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
                <input
                  type="text"
                  value={optionalProductCode}
                  onChange={(e) => setOptionalProductCode(e.target.value)}
                  placeholder="Product Code (e.g. 41672, 1276)"
                  className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-900 text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                />
              </div>
            )}
          </div>

          {/* Style Controls (Background & Presentation Panel Mode) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                Background Style:
              </label>
              <select
                value={selectedBgId}
                onChange={(e) => setSelectedBgId(e.target.value)}
                className="w-full text-xs bg-stone-950 border border-stone-700 text-white rounded-xl px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                {BANNER_BACKGROUNDS.map((bg) => (
                  <option key={bg.id} value={bg.id}>
                    {bg.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-cyan-400" />
                Product Presentation:
              </label>
              <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
                <button
                  type="button"
                  onClick={() => setPresentationMode('cutout')}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center ${
                    presentationMode === 'cutout'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Clean Cutout
                </button>
                <button
                  type="button"
                  onClick={() => setPresentationMode('studio-panel')}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all text-center ${
                    presentationMode === 'studio-panel'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title="Preserves 100% original edges and packaging inside a luxury panel"
                >
                  Studio Panel
                </button>
              </div>
            </div>
          </div>

          {/* Main Action Button */}
          <button
            type="button"
            onClick={handleGenerateBanner}
            disabled={isCompositing || !productImage || (!benefitsText.trim() && !benefitsImage)}
            className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 text-stone-950 font-bold text-base shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompositing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Compositing Pure Skin Reference Banner...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-stone-950" />
                <span>Generate Banner</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </div>
      )}

      {/* VIEW B: Final Banner Preview & Action Bar */}
      {generatedBannerUrl && (
        <div className="bg-[#121214] rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-2xl space-y-6">
          {/* Top Actions Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
                Two-Column 9:16 Ultra-HD Output (1080 × 1920)
              </span>
              <h3 className="text-lg font-bold text-white">Composited Advertising Banner</h3>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsEditingBenefits(true)}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Edit Benefits Text</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextMode = presentationMode === 'cutout' ? 'studio-panel' : 'cutout';
                  setPresentationMode(nextMode);
                  if (activeBenefitsData) {
                    renderTwoColumnBanner(activeBenefitsData, selectedBgId);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Layout className="w-3.5 h-3.5 text-cyan-400" />
                <span>Switch to {presentationMode === 'cutout' ? 'Studio Panel' : 'Cutout'}</span>
              </button>

              <button
                type="button"
                onClick={handleRegenerateBackgroundOnly}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cycles to the next clean background style without altering the product"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Next Background</span>
              </button>

              <button
                type="button"
                onClick={handleStartNewBanner}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Start New Banner</span>
              </button>
            </div>
          </div>

          {/* Live Preview Display (Strict 9:16 Aspect Ratio) */}
          <div className="flex justify-center p-3 rounded-2xl bg-black/60 border border-stone-800">
            <div
              className="relative rounded-xl overflow-hidden shadow-2xl border border-cyan-500/20 max-h-[660px] max-w-full"
              style={{ aspectRatio: '9 / 16' }}
            >
              <img
                src={generatedBannerUrl}
                alt="Composited Banner"
                className="w-full h-full object-contain bg-black"
              />
            </div>
          </div>

          {/* Bottom Action and Download Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-stone-400 text-center sm:text-left space-y-0.5">
              <p className="font-semibold text-stone-300">
                Balanced Two-Column Commercial Layout • No Oval Overlap • Ultra-HD 1080 × 1920
              </p>
              <p className="text-stone-500">
                Ready for Facebook, Instagram, WhatsApp status, and product marketing.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-linear-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 text-stone-950 font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-stone-950" />
                  <span>Downloaded PNG!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-stone-950" />
                  <span>Download Banner (PNG)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Edit Benefits Text */}
      {isEditingBenefits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121214] border border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Edit Urdu Headline & Benefits</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingBenefits(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Urdu Headline:</label>
                <input
                  type="text"
                  value={editableHeadline}
                  onChange={(e) => setEditableHeadline(e.target.value)}
                  dir="rtl"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-900 text-white font-urdu focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-300">
                  Benefit Points (5–6 Points, Urdu Script):
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editableBenefitsList.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2" dir="rtl">
                      <span className="w-5 text-xs text-cyan-400 font-bold">{i + 1}.</span>
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => {
                          const updated = [...editableBenefitsList];
                          updated[i] = e.target.value;
                          setEditableBenefitsList(updated);
                        }}
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-700 bg-stone-900 text-white font-urdu focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsEditingBenefits(false)}
                className="px-4 py-2 rounded-xl border border-stone-700 text-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedBenefits}
                className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-stone-950 font-bold text-xs"
              >
                Save & Update Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
