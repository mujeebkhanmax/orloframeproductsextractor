/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BannerBackgroundOption {
  id: string;
  name: string;
  description: string;
  type: 'ai-generated' | 'procedural';
  src?: string; // Path to 9:16 generated image asset
  accentColor: string;
  themeStyle: 'dark-gold' | 'aqua-fresh' | 'royal-emerald';
}

export const BANNER_BACKGROUNDS: BannerBackgroundOption[] = [
  {
    id: 'ai-black-gold',
    name: 'AI Luxury Black & Gold',
    description: 'Ultra-luxury obsidian 9:16 background with golden spotlight & bokeh',
    type: 'ai-generated',
    src: '/src/assets/images/luxury_black_gold_bg_1791631807410.jpg',
    accentColor: '#D4AF37',
    themeStyle: 'dark-gold',
  },
  {
    id: 'ai-pureskin-aqua',
    name: 'Pure Skin Aqua Fresh',
    description: 'Clean white & turquoise water splash with eucalyptus leaves for fresh skincare',
    type: 'ai-generated',
    src: '/src/assets/images/pureskin_aqua_fresh_bg_1791632926993.jpg',
    accentColor: '#06B6D4',
    themeStyle: 'aqua-fresh',
  },
  {
    id: 'ai-royal-emerald',
    name: 'Royal Emerald Botanical',
    description: 'Deep Swedish botanical emerald green with ornate gold border details',
    type: 'ai-generated',
    src: '/src/assets/images/emerald_gold_luxe_bg_1791631824374.jpg',
    accentColor: '#10B981',
    themeStyle: 'royal-emerald',
  },
  {
    id: 'ai-midnight-podium',
    name: 'Midnight Studio Podium',
    description: 'Minimalist charcoal cosmetic studio with circular floor illumination',
    type: 'ai-generated',
    src: '/src/assets/images/midnight_obsidian_bg_1791631839040.jpg',
    accentColor: '#F59E0B',
    themeStyle: 'dark-gold',
  },
  {
    id: 'ai-regal-noir',
    name: 'Regal Noir Architecture',
    description: 'Black marble architecture with top spotlight illumination',
    type: 'ai-generated',
    src: '/src/assets/images/regal_gold_noir_bg_1791631872260.jpg',
    accentColor: '#EAB308',
    themeStyle: 'dark-gold',
  },
  {
    id: 'procedural-midnight',
    name: 'Pure Obsidian Velvet',
    description: 'Dynamic canvas radial glow with golden dust particles and dark vignette',
    type: 'procedural',
    accentColor: '#F59E0B',
    themeStyle: 'dark-gold',
  },
  {
    id: 'procedural-emerald',
    name: 'Deep Emerald Silk',
    description: 'Dynamic canvas Swedish pine green with warm ambient illumination',
    type: 'procedural',
    accentColor: '#059669',
    themeStyle: 'royal-emerald',
  },
];
