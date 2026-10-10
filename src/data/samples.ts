export interface SampleProduct {
  id: string;
  name: string;
  code: string;
  range: string;
  category: string;
  descriptionUrdu: string;
  svgColor: string;
  secondaryColor: string;
  iconName: string;
  accent: string;
}

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: 'tender-care',
    name: 'Tender Care Protecting Balm',
    code: '1276',
    range: 'Tender Care',
    category: 'Skincare - Multi-purpose Balm',
    descriptionUrdu: 'مشہور کثیر المقاصد بام (ہونٹوں اور خشک جلد کے لیے قدرتی موم کا بام)',
    svgColor: '#D97706',
    secondaryColor: '#FEF3C7',
    iconName: 'Sparkles',
    accent: '#B45309',
  },
  {
    id: 'milk-honey-scrub',
    name: 'Milk & Honey Gold Smoothing Sugar Scrub',
    code: '31601',
    range: 'Milk & Honey Gold',
    category: 'Body Care - Exfoliator',
    descriptionUrdu: 'قدرتی شہد اور دودھ کے پروٹین پر مشتمل شاندار شوگر اسکرب',
    svgColor: '#CA8A04',
    secondaryColor: '#FEF08A',
    iconName: 'Droplet',
    accent: '#854D0E',
  },
  {
    id: 'optimals-hydra',
    name: 'Optimals Hydra Radiance Day Cream Light',
    code: '42566',
    range: 'Optimals',
    category: 'Skincare - Moisturiser',
    descriptionUrdu: 'سوئیڈش پودوں کے مرکب اور وٹامن سی اور ای کے ساتھ ہائیڈریٹنگ ڈے کریم',
    svgColor: '#0284C7',
    secondaryColor: '#E0F2FE',
    iconName: 'Sun',
    accent: '#0369A1',
  },
  {
    id: 'love-nature-tea-tree',
    name: 'Love Nature Purifying Face Oil with Organic Tea Tree & Lime',
    code: '34841',
    range: 'Love Nature',
    category: 'Skincare - Face Oil',
    descriptionUrdu: 'آرگینک ٹی ٹری آئل اور لائم ایکسٹریکٹ کے ساتھ چکنی جلد کے لیے فیس آئل',
    svgColor: '#16A34A',
    secondaryColor: '#DCFCE7',
    iconName: 'Leaf',
    accent: '#15803D',
  },
];

// Generates an SVG data URL representing a clean cosmetic product bottle/pack for testing
export function generateSampleDataUrl(sample: SampleProduct): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCF9F9"/>
        <stop offset="100%" stop-color="#FCE7F3"/>
      </linearGradient>
      <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="100%" stop-color="${sample.secondaryColor}"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.12"/>
      </filter>
    </defs>
    <rect width="600" height="600" fill="url(#bgGrad)"/>
    
    <!-- Decorative Beauty Elements -->
    <circle cx="500" cy="120" r="80" fill="${sample.secondaryColor}" opacity="0.6"/>
    <circle cx="100" cy="480" r="100" fill="${sample.secondaryColor}" opacity="0.4"/>
    
    <!-- Product Bottle / Jar Representation -->
    <g filter="url(#shadow)">
      <!-- Cap / Lid -->
      <rect x="230" y="140" width="140" height="50" rx="8" fill="${sample.svgColor}"/>
      <!-- Neck -->
      <rect x="250" y="190" width="100" height="25" fill="#E5E7EB"/>
      <!-- Body -->
      <rect x="180" y="215" width="240" height="260" rx="24" fill="url(#bottleGrad)" stroke="${sample.svgColor}" stroke-width="4"/>
      
      <!-- Label Graphic -->
      <rect x="205" y="245" width="190" height="200" rx="12" fill="#FFFFFF" fill-opacity="0.95" stroke="#E5E7EB" stroke-width="1.5"/>
      
      <!-- Brand & Product Text on Pack -->
      <text x="300" y="275" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="#374151" text-anchor="middle" letter-spacing="4">ORIFLAME</text>
      <text x="300" y="292" font-family="sans-serif" font-size="9" fill="#9CA3AF" text-anchor="middle" letter-spacing="2">SWEDEN</text>
      
      <line x1="240" y1="305" x2="360" y2="305" stroke="${sample.accent}" stroke-width="1.5"/>
      
      <text x="300" y="325" font-family="sans-serif" font-size="12" font-weight="bold" fill="${sample.accent}" text-anchor="middle">${sample.range.toUpperCase()}</text>
      
      <!-- Wrap Product Name -->
      <text x="300" y="350" font-family="sans-serif" font-size="11" font-weight="600" fill="#1F2937" text-anchor="middle">
        ${sample.name.length > 25 ? sample.name.substring(0, 25) + '...' : sample.name}
      </text>
      
      <text x="300" y="385" font-family="sans-serif" font-size="10" fill="#6B7280" text-anchor="middle">${sample.category}</text>
      
      <rect x="260" y="405" width="80" height="22" rx="4" fill="${sample.secondaryColor}"/>
      <text x="300" y="420" font-family="monospace" font-size="11" font-weight="bold" fill="${sample.accent}" text-anchor="middle">CODE ${sample.code}</text>
    </g>
    
    <text x="300" y="540" font-family="sans-serif" font-size="13" font-weight="500" fill="#4B5563" text-anchor="middle">Oriflame Official Cosmetic Formulation</text>
  </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
