# Translation Tool Guide

## Overview

The Translation Tool enables multilingual support for the voice bot, allowing users to speak in their native language (e.g., Spanish, French, German) while the bot processes and responds in English.

## How It Works

1. User speaks in Spanish (or any supported language)
2. The bot detects the language and uses the Translation Tool
3. The text is translated to English for processing
4. The bot responds in English

## Supported Languages

- Spanish (Español)
- French (Français)
- German (Deutsch)
- Italian (Italiano)
- Portuguese (Português)
- Chinese (中文)
- Japanese (日本語)
- Korean (한국어)
- Hindi (हिन्दी)
- Arabic (العربية)
- Russian (Русский)
- And many more...

## Usage Examples

### Example 1: Spanish to English
**User (Spanish):** "¿Cuál es el clima en Madrid?"
**Translation:** "What is the weather in Madrid?"
**Bot (English):** "Let me check the weather in Madrid for you..."

### Example 2: French to English
**User (French):** "Quelle heure est-il à Paris?"
**Translation:** "What time is it in Paris?"
**Bot (English):** "The current time in Paris is..."

### Example 3: German to English
**User (German):** "Wie ist das Wetter heute?"
**Translation:** "What is the weather today?"
**Bot (English):** "I'll check the current weather for you..."

## Configuration

The Translation Tool is automatically registered in the tool registry. To enable it in the UI:

1. Open the application
2. Go to Settings/Configuration panel
3. Enable "Translation" tool in the Tools section
4. The bot will now automatically detect and translate non-English input

## Technical Details

### API Used
The tool uses the MyMemory Translation API, which is:
- Free to use
- No API key required
- Supports 100+ languages
- Automatic language detection

### Tool Specification

```typescript
{
  name: 'translateTextTool',
  description: 'Translate text from one language to English',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'The text to translate' },
      sourceLanguage: { type: 'string', description: 'Source language code (optional, auto-detect)' },
      targetLanguage: { type: 'string', description: 'Target language code (default: "en")' }
    },
    required: ['text']
  }
}
```

### Response Format

```json
{
  "success": true,
  "original": {
    "text": "¿Cuál es el clima?",
    "language": "es"
  },
  "translated": {
    "text": "What is the weather?",
    "language": "en"
  },
  "detectedLanguage": "es"
}
```

## Integration with System Prompt

To make the bot automatically use translation, you can add this to your system prompt:

```markdown
If the user speaks in a language other than English, use the translateTextTool to translate their input to English before processing. Always respond in English, even if the user speaks another language.
```

## Limitations

1. Translation quality depends on the API service
2. Some idiomatic expressions may not translate perfectly
3. Technical or domain-specific terms may need context
4. Real-time translation adds slight latency (~200-500ms)

## Troubleshooting

### Translation Not Working
- Check internet connectivity
- Verify the tool is enabled in configuration
- Check console logs for API errors

### Poor Translation Quality
- Try being more explicit in the system prompt
- Consider using a different translation API (Google Translate, DeepL)
- Add context to help with domain-specific terms

### Language Not Detected
- Ensure the input text is long enough (at least 3-4 words)
- Manually specify the source language if auto-detection fails

## Alternative Translation APIs

If you want to use a different translation service, modify `src/tools/TranslationTool.ts`:

### Google Translate API
```typescript
// Requires API key
const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
```

### DeepL API
```typescript
// Requires API key, better quality
const url = `https://api-free.deepl.com/v2/translate`;
```

### LibreTranslate (Self-hosted)
```typescript
// Free, open-source, self-hosted
const url = `http://localhost:5000/translate`;
```

## Best Practices

1. **Enable in System Prompt**: Make sure your system prompt instructs the bot to use translation when needed
2. **Test Multiple Languages**: Test with various languages to ensure quality
3. **Monitor Performance**: Check translation latency and adjust if needed
4. **Fallback Strategy**: If translation fails, the tool returns the original text
5. **User Feedback**: Inform users that translation is happening for transparency

## Future Enhancements

- Bidirectional translation (bot responds in user's language)
- Caching frequently translated phrases
- Support for multiple translation APIs with fallback
- Language preference per user session
- Translation confidence scores

---

**Version:** 1.0.0  
**Last Updated:** March 12, 2026  
**Maintained By:** Development Team
