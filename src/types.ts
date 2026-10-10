export interface KeyIngredient {
  name: string;
  cosmeticFunctionUrdu: string;
  isOfficialClaim: boolean;
}

export interface DetectedDetails {
  productNameEnglish: string;
  productRangeOrLine: string;
  productCode: string;
  categoryEnglish: string;
  packagingType?: string;
}

export interface UrduContent {
  productNameUrdu: string;
  rangeUrdu: string;
  categoryUrdu: string;
  benefits: string[];
  keyIngredients: KeyIngredient[];
  howToUseUrdu: string;
  precautionsUrdu: string;
  officialClaimsDistinctionUrdu: string;
  verifiedSourceNoteUrdu: string;
  countryDisclaimerUrdu: string;
}

export interface OfficialImageInfo {
  isFound: boolean;
  imageUrl?: string;
  imageBase64?: string;
  source?: string;
  fileSizeBytes?: number;
  format?: string;
  verifiedProductCode?: string;
  fallbackReason?: string;
}

export interface ProductAnalysisResponse {
  isOriflameProduct: boolean;
  identificationConfidence: 'high' | 'medium' | 'low' | 'uncertain';
  needsUserClarification: boolean;
  clarificationMessageUrdu?: string;
  clarificationMessageEnglish?: string;
  detectedDetails: DetectedDetails;
  urduContent: UrduContent;
  formattedUrduSummary: string;
  officialImage?: OfficialImageInfo;
}
