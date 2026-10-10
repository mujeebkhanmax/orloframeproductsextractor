import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for parsing JSON with ample capacity for base64 images
app.use(express.json({ limit: '15mb' }));

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.8-flash',
  });
});

// Identify Oriflame product & produce Urdu benefits
app.post('/api/identify-product', async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: 'API key not configured',
        message: 'GEMINI_API_KEY is not set on the server environment. Please check settings/secrets.',
      });
    }

    const { imageBase64, mimeType = 'image/jpeg', userHint } = req.body;

    if (!imageBase64 && !userHint) {
      return res.status(400).json({
        error: 'Missing input',
        message: 'Please provide a product image or product name/code.',
      });
    }

    const contentsParts: any[] = [];

    if (imageBase64) {
      // Clean base64 if it includes prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      contentsParts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const promptText = `
You are the expert Oriflame Product Benefits Specialist & Urdu Linguistic Advisor for "ZK Oriflame Products Benefit Extractor".
Your job is to examine this product image (and user-supplied hint, if any: "${userHint || 'None'}"), identify the Oriflame product with high precision, and output complete, verified, accurate product information in fluent, authentic Urdu script (اردو رسم الخط).

STRICT FACTUAL GUIDELINES:
1. IDENTIFICATION ACCURACY:
   - Carefully inspect the image for Oriflame logo, brand ranges (e.g., NovAge, Novage+, Optimals, Love Nature, Giordani Gold, The ONE, Milk & Honey Gold, Tender Care, Pure Skin, HairX, Feet Up, Activelle, Wellness by Oriflame, North for Men, Essense&Co, Beautanicals, Waunt, etc.), product name, and numerical product code (5-digit code like 32658, 1276, 42566, etc. if visible on the pack).
   - If the image is blurry, ambiguous, not an Oriflame product, or you cannot determine the exact item with confidence, set identificationConfidence to "low" or "uncertain", needsUserClarification to true, and explain clearly in English requesting the user to provide the product name or 5-digit code.
   - NEVER invent or guess a product identity if uncertain.

2. PRODUCT BENEFITS LIST (CRITICAL REQUIREMENTS):
   - Provide a clear list of 5 to 10 relevant, concise product benefits strictly in authentic Urdu script (اردو رسم الخط).
   - STRICT PROHIBITION: Do NOT include precautions, warnings, usage instructions, disclaimers, or precautionary lines inside the benefits list!
   - Every item in the benefits list must be a genuine, positive cosmetic benefit (e.g. hydration, smoothing, radiance, cleansing, antioxidant protection, fragrance longevity).
   - Do NOT use Roman Urdu or Hindi/Devanagari.
   - Do NOT claim medical cures, disease treatments, genetic modifications, or unsubstantiated clinical percentages.

3. INGREDIENTS & COSMETIC FUNCTIONS:
   - List key verified ingredients known in this specific Oriflame formula.
   - Clearly explain their cosmetic function in Urdu.
   - Clearly distinguish verified official Oriflame claims from general cosmetic ingredient science.

4. USAGE & PRECAUTIONS (SEPARATE SECTIONS):
   - Provide How to Use (استعمال کا طریقہ) and Precautions (احتیاطی تدابیر) in their own separate dedicated fields, NEVER merged into the benefits list.

5. FORMATTED URDU SUMMARY:
   - Provide a clean, beautifully formatted plain-text copy string in Urdu suitable for sharing via WhatsApp, SMS, or social media with emojis, headings, and bullet points.
`;

    contentsParts.push({ text: promptText });

    const modelsToTry = ['gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-3.8-flash'];
    let lastError: any = null;
    let responseText: string | null = null;

    for (const modelCandidate of modelsToTry) {
      try {
        const configObj: any = {
          systemInstruction: 'You are a meticulous Oriflame beauty & wellness product specialist who provides verified cosmetic information in elegant, natural Urdu script. You never fabricate product identities, clinical claims, or fake links.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isOriflameProduct: {
                type: Type.BOOLEAN,
                description: 'Whether the image is identified as an Oriflame product',
              },
                identificationConfidence: {
                  type: Type.STRING,
                  description: 'Confidence level: high, medium, low, or uncertain',
                },
                needsUserClarification: {
                  type: Type.BOOLEAN,
                  description: 'True if image is unclear or product identity requires manual user input',
                },
                clarificationMessageUrdu: {
                  type: Type.STRING,
                  description: 'Polite explanation in Urdu if clarification or product code is needed',
                },
                clarificationMessageEnglish: {
                  type: Type.STRING,
                  description: 'Explanation in English if clarification is needed',
                },
                detectedDetails: {
                  type: Type.OBJECT,
                  properties: {
                    productNameEnglish: {
                      type: Type.STRING,
                      description: 'Full official English product name',
                    },
                    productRangeOrLine: {
                      type: Type.STRING,
                      description: 'Range/Sub-brand name like NovAge, Optimals, Milk & Honey Gold, etc.',
                    },
                    productCode: {
                      type: Type.STRING,
                      description: 'Numerical product code if visible or recognized, or "Not visible / فراہم نہیں"',
                    },
                    categoryEnglish: {
                      type: Type.STRING,
                      description: 'Category in English, e.g., Skincare, Fragrance, Body Care',
                    },
                    packagingType: {
                      type: Type.STRING,
                      description: 'e.g. Jar, Pump Bottle, Tube, Stick',
                    },
                  },
                  required: ['productNameEnglish', 'productRangeOrLine', 'categoryEnglish'],
                },
                urduContent: {
                  type: Type.OBJECT,
                  properties: {
                    productNameUrdu: {
                      type: Type.STRING,
                      description: 'Product name in Urdu script',
                    },
                    rangeUrdu: {
                      type: Type.STRING,
                      description: 'Range name in Urdu script',
                    },
                    categoryUrdu: {
                      type: Type.STRING,
                      description: 'Product category in Urdu script',
                    },
                    benefits: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.STRING,
                      },
                      description: '5 to 10 concise, truthful product benefits strictly in authentic Urdu script. Must contain pure benefits only (no precautions, no warnings, no usage instructions)',
                    },
                    keyIngredients: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: {
                            type: Type.STRING,
                            description: 'Ingredient name (e.g., Organic Honey Extract / قدرتی شہد کا عرق)',
                          },
                          cosmeticFunctionUrdu: {
                            type: Type.STRING,
                            description: 'Known cosmetic function in Urdu script',
                          },
                          isOfficialClaim: {
                            type: Type.BOOLEAN,
                            description: 'True if direct official Oriflame highlight, false if cosmetic science knowledge',
                          },
                        },
                        required: ['name', 'cosmeticFunctionUrdu', 'isOfficialClaim'],
                      },
                      description: 'Key ingredients and cosmetic functions',
                    },
                    howToUseUrdu: {
                      type: Type.STRING,
                      description: 'Clear, polite step-by-step usage guide in Urdu script',
                    },
                    precautionsUrdu: {
                      type: Type.STRING,
                      description: 'Precautions (patch test, eye contact, sun safety, storage) in Urdu script',
                    },
                    officialClaimsDistinctionUrdu: {
                      type: Type.STRING,
                      description: 'Explanation distinguishing official Oriflame packaging claims vs general ingredient benefits in Urdu',
                    },
                    verifiedSourceNoteUrdu: {
                      type: Type.STRING,
                      description: 'Statement of verified source (e.g. official packaging & product label) without inventing fake URLs',
                    },
                    countryDisclaimerUrdu: {
                      type: Type.STRING,
                      description: 'Urdu disclaimer that formula and availability can vary across countries and markets',
                    },
                  },
                  required: [
                    'productNameUrdu',
                    'categoryUrdu',
                    'benefits',
                    'keyIngredients',
                    'howToUseUrdu',
                    'precautionsUrdu',
                    'officialClaimsDistinctionUrdu',
                    'verifiedSourceNoteUrdu',
                    'countryDisclaimerUrdu',
                  ],
                },
                formattedUrduSummary: {
                  type: Type.STRING,
                  description: 'Full beautifully formatted text in Urdu with emojis and dividers ready for one-click copy',
                },
              },
              required: [
                'isOriflameProduct',
                'identificationConfidence',
                'needsUserClarification',
                'detectedDetails',
                'urduContent',
                'formattedUrduSummary',
              ],
            },
          };

        if (modelCandidate.includes('gemini-3')) {
          configObj.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const response = await ai.models.generateContent({
          model: modelCandidate,
          contents: { parts: contentsParts },
          config: configObj,
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelCandidate} attempt failed:`, err?.message || err);
        // Wait 1 second before trying next model
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!responseText) {
      throw lastError || new Error('All model attempts failed to return content');
    }

    const parsed = JSON.parse(responseText);

    // Retrieve official Oriflame product image from official media CDN
    const rawProductCode = parsed.detectedDetails?.productCode || '';
    const officialImage = await retrieveOfficialOriflameImage(rawProductCode);
    parsed.officialImage = officialImage;

    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing Oriflame product:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error?.message || 'Failed to process product image. Please try again.',
    });
  }
});

// Dedicated endpoint to search or re-fetch official Oriflame product image by code
app.post('/api/search-official-image', async (req, res) => {
  try {
    const { productCode, query } = req.body;
    const targetCode = productCode || query || '';
    const result = await retrieveOfficialOriflameImage(targetCode);
    return res.json(result);
  } catch (error: any) {
    console.error('Error retrieving official product image:', error);
    return res.status(500).json({
      isFound: false,
      fallbackReason: 'Failed to query Oriflame media CDN.',
    });
  }
});

// Process supplied benefits (from text, text file, or uploaded benefits image)
app.post('/api/parse-benefits', async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        success: false,
        message: 'GEMINI_API_KEY is not configured on the server environment.',
      });
    }

    const { rawText, imageBase64, mimeType = 'image/jpeg', productName = '', productCode = '' } = req.body;

    if (!rawText && !imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either benefits text or an image containing product benefits.',
      });
    }

    const contentsParts: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      contentsParts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const promptText = `
You are the Benefit Processor for the ZK Oriflame Banner System.
Your job is to read and process the supplied product benefits based strictly on the following guidelines:

MASTER GUIDELINES:
1. Use only the supplied benefits. Preserve their exact meaning and do not invent product claims, ingredients, specifications, prices, discounts, certifications, customer reviews, or clinical results.
2. If text is provided in English or Urdu, or if an image of a benefits brochure / catalog page is supplied, read it carefully (OCR/vision).
3. Organize the verified points into 5 or 6 concise, readable Urdu benefit points (فائدے) in correct Pakistani Urdu script (اردو رسم الخط).
4. Provide a clear, natural Urdu headline (عنوان) and identify the product name and product code if supplied or visible.
5. If no readable benefits can be found in the image or text, set success to false and explain why.

Supplied product hint: "${productName || 'None'}"
Supplied code hint: "${productCode || 'None'}"
Supplied text:
"""
${rawText || 'None supplied (please inspect uploaded image)'}
"""
`;

    contentsParts.push({ text: promptText });

    const modelsToTry = ['gemini-flash-lite-latest', 'gemini-3-flash-preview', 'gemini-3.8-flash'];
    let lastError: any = null;
    let responseText: string | null = null;

    for (const modelCandidate of modelsToTry) {
      try {
        const configObj: any = {
          systemInstruction: 'You are an authentic Oriflame benefits processor who organizes user-supplied benefits into 5-6 concise Urdu points without inventing claims.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              success: { type: Type.BOOLEAN },
              urduHeadline: { type: Type.STRING, description: 'Clear Urdu headline' },
              productName: { type: Type.STRING, description: 'Product name in English/Urdu' },
              productCode: { type: Type.STRING, description: '5-digit code if known' },
              benefits: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Five or six concise Urdu benefit points in correct Urdu script',
              },
              rawExtractedText: { type: Type.STRING, description: 'Text read from input' },
              confidence: { type: Type.STRING, description: 'high, medium, or low' },
              message: { type: Type.STRING, description: 'Explanation if low confidence or error' },
            },
            required: ['success', 'urduHeadline', 'benefits'],
          },
        };

        if (modelCandidate.includes('gemini-3')) {
          configObj.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
        }

        const response = await ai.models.generateContent({
          model: modelCandidate,
          contents: { parts: contentsParts },
          config: configObj,
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelCandidate} failed:`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error('Failed to process benefits.');
    }

    const parsed = JSON.parse(responseText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error parsing benefits:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to process benefits. Please enter or paste them directly.',
    });
  }
});

// Helper function to query and validate authentic Oriflame images from official CDN
async function retrieveOfficialOriflameImage(codeOrQuery: string) {
  const cleanCode = (codeOrQuery || '').replace(/[^0-9]/g, '');
  if (!cleanCode || cleanCode.length < 3 || cleanCode.length > 6) {
    return {
      isFound: false,
      fallbackReason: 'No valid numerical 5-digit product code detected to query official Oriflame catalogue.',
    };
  }

  // Official Oriflame Global Media CDN candidate patterns
  const candidateUrls = [
    `https://media-cdn.oriflame.com/productImage?externalMediaId=product-management-media%2FProducts%2F${cleanCode}%2F${cleanCode}_1.png`,
    `https://media-cdn.oriflame.com/productImage?externalMediaId=product-management-media%2fProducts%2f${cleanCode}%2f${cleanCode}_1.png`,
    `https://media-cdn.oriflame.com/productImage?externalMediaId=product-management-media%2FProducts%2F${cleanCode}%2F${cleanCode}.png`,
    `https://media-cdn.oriflame.com/productImage?externalMediaId=product-management-media%2FProducts%2F${cleanCode}%2F${cleanCode}_2.png`,
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        if (contentType.startsWith('image/')) {
          const arrayBuffer = await response.arrayBuffer();
          // Ensure file is real studio packshot (larger than 2KB)
          if (arrayBuffer.byteLength > 2000) {
            const base64Data = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:${contentType};base64,${base64Data}`;
            return {
              isFound: true,
              imageUrl: url,
              imageBase64: dataUrl,
              source: 'Official Oriflame Global Media CDN (media-cdn.oriflame.com)',
              fileSizeBytes: arrayBuffer.byteLength,
              format: contentType.split('/')[1] || 'jpeg',
              verifiedProductCode: cleanCode,
            };
          }
        }
      }
    } catch (err: any) {
      console.warn(`Failed fetching candidate ${url}:`, err?.message);
    }
  }

  return {
    isFound: false,
    verifiedProductCode: cleanCode,
    fallbackReason: `Official studio packshot for code #${cleanCode} could not be automatically located on the Oriflame catalog CDN. Original uploaded photo will be preserved as fallback.`,
  };
}

// Configure Vite in dev mode or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 Oriflame Product Benefits Assistant server running on port ${PORT}`);
  });
}

startServer();
