/**
 * TranslationTool - Translates user input to English for processing
 * 
 * This tool allows users to speak in their native language (e.g., Spanish)
 * while the bot processes and responds in English.
 */
import { Tool } from './Tool';

interface TranslationParams {
    text: string;
    sourceLanguage?: string;
    targetLanguage?: string;
}

interface TranslationToolContent {
    content?: string;
    text?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
}

// Language code mappings
const LANGUAGE_CODES: Record<string, string> = {
    'spanish': 'es',
    'español': 'es',
    'french': 'fr',
    'français': 'fr',
    'german': 'de',
    'deutsch': 'de',
    'italian': 'it',
    'italiano': 'it',
    'portuguese': 'pt',
    'português': 'pt',
    'chinese': 'zh',
    '中文': 'zh',
    'japanese': 'ja',
    '日本語': 'ja',
    'korean': 'ko',
    '한국어': 'ko',
    'hindi': 'hi',
    'हिन्दी': 'hi',
    'arabic': 'ar',
    'العربية': 'ar',
    'russian': 'ru',
    'русский': 'ru',
    'english': 'en'
};

function resolveLanguageCode(lang?: string): string {
    if (!lang) return 'auto';
    const normalized = lang.toLowerCase().trim();
    return LANGUAGE_CODES[normalized] || lang;
}

function parseParams(params: unknown): TranslationParams | null {
    const content = params as TranslationToolContent;
    
    const text = content?.text || content?.content;
    if (!text) return null;
    
    return {
        text,
        sourceLanguage: content?.sourceLanguage,
        targetLanguage: content?.targetLanguage || 'en'
    };
}

/**
 * Translate text using a free translation API
 * Using LibreTranslate API (self-hosted or public instance)
 */
async function translateText(
    text: string, 
    sourceLang: string = 'auto', 
    targetLang: string = 'en'
): Promise<object> {
    try {
        // Using MyMemory Translation API (free, no API key required)
        // Alternative: LibreTranslate, Google Translate API, etc.
        const langPair = sourceLang === 'auto' ? `${targetLang}` : `${sourceLang}|${targetLang}`;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'NovaSonicVoicebot/1.0',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Translation API returned ${response.status}`);
        }

        const data = await response.json();
        
        if (data.responseStatus !== 200) {
            throw new Error(`Translation failed: ${data.responseDetails || 'Unknown error'}`);
        }

        return {
            success: true,
            original: {
                text,
                language: sourceLang
            },
            translated: {
                text: data.responseData.translatedText,
                language: targetLang
            },
            detectedLanguage: data.responseData.match || sourceLang
        };
    } catch (error) {
        console.error('Translation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Translation failed',
            original: {
                text,
                language: sourceLang
            },
            translated: {
                text: text, // Return original text if translation fails
                language: targetLang
            }
        };
    }
}

export const TranslationTool: Tool = {
    name: 'translateTextTool',
    description: `Translate text from one language to English. Useful when user speaks in Spanish, French, German, or other languages but the bot should respond in English. 
    
Use this tool when:
- User speaks in a non-English language
- You need to understand what the user said in their native language
- You want to process the request in English

Supported languages: Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Hindi, Arabic, Russian, and more.`,
    
    inputSchema: {
        type: 'object',
        properties: {
            text: {
                type: 'string',
                description: 'The text to translate'
            },
            sourceLanguage: {
                type: 'string',
                description: 'Source language code (e.g., "es" for Spanish, "fr" for French). Use "auto" for automatic detection. Optional.'
            },
            targetLanguage: {
                type: 'string',
                description: 'Target language code (default: "en" for English). Optional.'
            }
        },
        required: ['text']
    },

    async execute(params: unknown): Promise<object> {
        const parsed = parseParams(params);
        
        if (!parsed) {
            throw new Error('Invalid translation parameters: text is required');
        }

        const sourceLang = resolveLanguageCode(parsed.sourceLanguage);
        const targetLang = resolveLanguageCode(parsed.targetLanguage);

        console.log(`Translating text from ${sourceLang} to ${targetLang}: "${parsed.text.substring(0, 50)}..."`);
        
        return translateText(parsed.text, sourceLang, targetLang);
    }
};
