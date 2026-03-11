# Codebase Analysis - Amazon Nova 2 Sonic Voice Bot

## Executive Summary

This is a real-time conversational AI application using Amazon Nova 2 Sonic, AWS's speech-to-speech foundation model. The application enables natural voice conversations with AI through bidirectional audio streaming, tool calling, and multi-language support.

## Architecture Overview

### High-Level Architecture
```
┌─────────────────────┐     WebSocket      ┌──────────────────────┐    AWS Bedrock    ┌─────────────────┐
│   Browser Client    │◄──────────────────►│   Express Server     │◄─────────────────►│  Nova 2 Sonic   │
│   (Vanilla JS)      │   Socket.IO        │   (TypeScript)       │   Bidirectional   │  Model          │
│   - Audio Capture   │                    │   - Session Mgmt     │   Streaming       │                 │
│   - Audio Playback  │                    │   - Tool Execution   │                   │                 │
│   - UI Management   │                    │   - Event Routing    │                   │                 │
└─────────────────────┘                    └──────────────────────┘                   └─────────────────┘
```

### Technology Stack

**Backend:**
- Node.js with TypeScript
- Express.js for HTTP server
- Socket.IO for WebSocket communication
- AWS SDK v3 (Bedrock Runtime)
- RxJS for reactive stream handling

**Frontend:**
- Vanilla JavaScript (no framework)
- Web Audio API for audio capture/playback
- Canvas API for visualizations
- Socket.IO client

**AWS Services:**
- Amazon Bedrock (Nova 2 Sonic model)
- Bedrock Runtime API (bidirectional streaming)

## Project Structure

```
sample-voicebot-nova-sonic/
├── src/                          # Backend TypeScript source
│   ├── client.ts                 # AWS Bedrock client & session management
│   ├── server.ts                 # Express server & Socket.IO handlers
│   ├── consts.ts                 # Configuration constants
│   ├── types.ts                  # Core type definitions
│   ├── config/
│   │   └── knowledge-base.ts     # Knowledge base configuration
│   ├── lib/
│   │   └── KnowledgeBaseService.ts  # KB search & retrieval
│   ├── tools/                    # Tool implementations
│   │   ├── Tool.ts               # Base tool interface & registry
│   │   ├── KnowledgeBaseTool.ts  # Search company knowledge base
│   │   ├── DateTimeTool.ts       # Current date/time
│   │   ├── WeatherTool.ts        # Weather forecasts
│   │   ├── WikipediaTool.ts      # Wikipedia search
│   │   ├── LocationSearchTool.ts # Geocoding
│   │   ├── ReasoningTool.ts      # Extended thinking
│   │   └── TranscriptCorrectionTool.ts  # ASR error fixing
│   └── types/
│       ├── events.ts             # Event type definitions
│       └── knowledge.ts          # Knowledge base types
├── public/                       # Frontend static files
│   ├── index.html                # Main UI
│   ├── src/
│   │   ├── main.js               # Main client logic
│   │   ├── typing.js             # Text input mode
│   │   ├── style.css             # Styling
│   │   ├── lib/                  # Client libraries
│   │   └── ui/                   # UI components
│   └── prompts/                  # System prompt templates
│       ├── default.md
│       ├── electricity_service.md  # Custom electricity utility prompt
│       ├── insurance_service.md
│       ├── intelligent_assistant.md
│       └── tutor.md
├── data/
│   └── knowledge-base/
│       └── index.json            # Knowledge base entries (15 Q&A)
├── dist/                         # Compiled JavaScript output
├── package.json
└── tsconfig.json
```

## Core Components

### 1. Backend Server (src/server.ts)

**Responsibilities:**
- HTTP server setup with Express
- Socket.IO WebSocket management
- Session lifecycle management
- Audio/text streaming coordination
- Tool execution orchestration

**Key Features:**
- Multi-region support (Tokyo, Virginia, Oregon, Stockholm)
- Session state tracking (INITIALIZING, READY, ACTIVE, CLOSED)
- Automatic cleanup of inactive sessions (5-minute timeout)
- Graceful shutdown handling
- Configuration per session (voice, timing, inference params)

**Socket.IO Events:**
- `initializeConnection` - Create new session with config
- `startNewChat` - Reset conversation
- `promptStart` - Begin new prompt
- `systemPrompt` - Set system instructions
- `audioStart` - Start audio streaming
- `audioInput` - Stream audio chunks
- `textInput` - Send text message
- `stopAudio` - End session
- `disconnect` - Client disconnection

### 2. AWS Bedrock Client (src/client.ts)

**Class: NovaSonicBidirectionalStreamClient**

**Responsibilities:**
- Manage AWS Bedrock connections
- Handle bidirectional streaming
- Execute tool calls
- Route events to handlers
- Session lifecycle management

**Key Methods:**
- `createStreamSession()` - Initialize new session
- `initiateBidirectionalStreaming()` - Start AWS connection
- `handleToolUse()` - Execute tool and return result
- `closeSession()` - Graceful session termination
- `forceCloseSession()` - Emergency cleanup

**Event Flow:**
```
Client Audio → audioInput → streamAudio() → AWS Bedrock
                                              ↓
AWS Bedrock → Event Stream → dispatchEvent() → Socket.IO → Client
```

### 3. Tool System (src/tools/)

**Architecture:**
- Tool Registry pattern for dynamic tool management
- Each tool implements `Tool` interface
- Tools registered at startup in `createDefaultToolRegistry()`
- Async execution with error handling

**Tool Interface:**
```typescript
interface Tool {
    name: string;
    description: string;
    inputSchema: object;  // JSON Schema
    execute(params: unknown, context?: ToolContext): Promise<object>;
}
```

**Available Tools:**
1. **KnowledgeBaseTool** - Search internal knowledge base
2. **DateTimeTool** - Get current date/time
3. **WeatherTool** - Fetch weather forecasts (Open-Meteo API)
4. **WikipediaTool** - Search Wikipedia
5. **LocationSearchTool** - Geocode locations
6. **ReasoningTool** - Extended thinking with Claude/Nova
7. **TranscriptCorrectionTool** - Fix ASR errors

### 4. Knowledge Base System

**Components:**
- `KnowledgeBaseService` (Singleton pattern)
- `KnowledgeBaseTool` (Tool interface)
- `knowledge-base.ts` (Configuration)
- `index.json` (Data storage)

**Search Algorithm:**
- Tokenize query into terms
- Calculate relevance score per entry:
  - Title matches: 3.0x weight
  - Content matches: 1.0x weight
  - Tag matches: 2.0x weight
  - Category matches: 1.5x weight
- Normalize by content length
- Sort by score, return top N results

**Current Configuration:**
- 5 categories: outage, service, connection, payment, meter
- 15 entries (3 per category)
- 5-minute cache duration
- Max 5 results per search
- Min relevance score: 0.1

### 5. Frontend Client (public/src/main.js)

**Responsibilities:**
- Audio capture via Web Audio API
- Audio playback with buffering
- UI state management
- Chat history display
- Settings management
- Waveform visualization

**Audio Pipeline:**
```
Microphone → AudioContext → ScriptProcessor → Resampling (16kHz) → 
Base64 Encoding → Socket.IO → Server
```

**Key Features:**
- Automatic resampling to 16kHz mono PCM
- Firefox compatibility handling
- Adaptive audio buffering
- Barge-in support (interrupt AI mid-response)
- Text input mode (crossmodal)
- Theme switching (dark/light)

## Data Flow

### Voice Input Flow
```
1. User speaks → Microphone
2. Web Audio API captures audio (48kHz typically)
3. ScriptProcessor resamples to 16kHz mono PCM
4. Base64 encode audio chunks
5. Socket.IO emits 'audioInput' event
6. Server forwards to AWS Bedrock
7. Nova 2 Sonic processes audio
8. Model generates response (audio + text)
9. Server receives events from Bedrock
10. Socket.IO emits events to client
11. Client decodes and plays audio
12. UI updates with transcriptions
```

### Tool Calling Flow
```
1. Nova 2 Sonic decides to use tool
2. Bedrock emits 'toolUse' event
3. Server receives event
4. ToolRegistry.execute(toolName, params)
5. Tool executes (may call external APIs)
6. Tool returns result
7. Server sends 'toolResult' to Bedrock
8. Nova incorporates result into response
9. Continues conversation naturally
```

### Knowledge Base Query Flow
```
1. User asks question about electricity service
2. Nova 2 Sonic invokes searchKnowledgeBase tool
3. KnowledgeBaseTool.execute() called
4. KnowledgeBaseService.search(query, options)
5. Load index.json (cached for 5 min)
6. Calculate relevance scores
7. Return top 3 results
8. Tool formats results for Nova
9. Nova incorporates KB info into response
10. User hears natural answer
```

## Configuration System

### Server-Side Config
- AWS region selection
- Model ID (Nova 2 Sonic)
- Inference parameters (temperature, topP, maxTokens)
- Turn detection sensitivity
- Audio quality settings
- Tool availability

### Client-Side Config (UI Settings)
- Voice selection (Tiffany/Matthew)
- Response timing (fast/medium/slow)
- Output sample rate (8/16/24 kHz)
- Initial audio buffer (0-1000ms)
- Temperature (0-1)
- Top P (0-1)
- Max tokens (256-4096)
- Enabled tools (checkboxes)
- AWS region
- System prompt (preset or custom)

### System Prompts
Located in `public/prompts/`:
- **default.md** - Friendly conversational assistant
- **electricity_service.md** - Electricity utility customer service
- **insurance_service.md** - Insurance customer service
- **intelligent_assistant.md** - General-purpose with tools
- **tutor.md** - Math tutor

## Key Features

### 1. Bidirectional Streaming
- Real-time audio streaming in both directions
- Low latency (~200-500ms)
- Chunked audio processing
- Adaptive buffering

### 2. Turn Detection
- Automatic pause detection
- Configurable sensitivity (HIGH/MEDIUM/LOW)
- Natural conversation flow
- No manual push-to-talk needed

### 3. Barge-In Support
- Interrupt AI mid-response
- Graceful handling of interruptions
- Context preservation
- Smooth conversation recovery

### 4. Multi-Language Support
- Polyglot voices (switch languages mid-conversation)
- Supported: English, Spanish, French, German, Italian, Portuguese, Hindi
- Also works: Chinese, Japanese

### 5. Tool Calling
- Asynchronous tool execution
- Multiple tools can run in parallel
- Results incorporated naturally
- Extensible tool system

### 6. Crossmodal Interaction
- Voice input mode (default)
- Text input mode (typing)
- Seamless switching
- Same conversation context

## Security Considerations

### Current Implementation
- AWS credentials via environment variables or profile
- No authentication on web interface
- No rate limiting
- No input validation on client side
- Tools have unrestricted API access

### Recommendations
1. Add authentication (OAuth, JWT)
2. Implement rate limiting per user
3. Validate and sanitize all inputs
4. Add CORS restrictions
5. Use API keys for external services
6. Implement session timeouts
7. Add audit logging
8. Encrypt sensitive data in transit/rest
9. Add CSP headers
10. Implement tool permission system

## Performance Characteristics

### Latency
- Audio capture: ~20ms chunks
- Network: 50-200ms (depends on region)
- Model inference: 200-500ms
- Audio playback: 200ms buffer (configurable)
- **Total: ~500-1000ms** (first response)

### Resource Usage
- Memory: ~50-100MB per session
- CPU: Low (mostly I/O bound)
- Network: ~32 kbps audio (16kHz mono)
- AWS costs: ~$0.01-0.05 per minute

### Scalability
- Current: Single server, multiple sessions
- Bottleneck: AWS Bedrock quotas
- Max concurrent: 10 streams per client (configurable)
- Session cleanup: 5-minute timeout

## Known Issues & Limitations

### 1. Knowledge Base Not Working
**Issue:** Nova 2 Sonic not using knowledge base tool
**Root Cause:** 
- Category mismatch between config and data
- System prompt didn't instruct tool usage
- Tool might not be enabled in UI

**Solution Applied:**
- Updated config categories to match data
- Created electricity_service.md prompt with explicit tool instructions
- Added prompt to UI dropdown

### 2. Firefox Audio Compatibility
**Issue:** Different audio processing in Firefox
**Workaround:** Special handling with `isFirefox` flag

### 3. Session Management
**Issue:** Sessions not always cleaned up properly
**Mitigation:** 
- 5-minute timeout
- Force close on errors
- Graceful shutdown handling

### 4. Tool Execution Errors
**Issue:** Tools can fail silently
**Mitigation:** Error logging and fallback responses

### 5. Audio Buffer Underruns
**Issue:** Choppy playback on slow connections
**Mitigation:** Configurable initial buffer (200ms default)

## Testing Strategy

### Current State
- No automated tests
- Manual testing only
- No CI/CD pipeline

### Recommended Tests
1. **Unit Tests**
   - Tool execution
   - Knowledge base search
   - Audio resampling
   - Event handling

2. **Integration Tests**
   - Socket.IO communication
   - AWS Bedrock streaming
   - Session lifecycle
   - Tool calling flow

3. **E2E Tests**
   - Full conversation flow
   - Barge-in scenarios
   - Multi-language switching
   - Error recovery

4. **Performance Tests**
   - Latency measurements
   - Concurrent sessions
   - Memory leaks
   - Audio quality

## Deployment Considerations

### Prerequisites
- Node.js 18+
- AWS account with Bedrock access
- AWS credentials configured
- Network access to AWS regions

### Environment Variables
```bash
AWS_PROFILE=your-profile
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=ap-northeast-1
HOST=0.0.0.0  # Optional: listen on all interfaces
PORT=3000     # Optional: custom port
```

### Build & Run
```bash
npm install
npm run build
npm start
```

### Production Recommendations
1. Use process manager (PM2, systemd)
2. Set up reverse proxy (nginx)
3. Enable HTTPS
4. Configure logging (Winston, Bunyan)
5. Add monitoring (CloudWatch, Datadog)
6. Implement health checks
7. Set up auto-scaling
8. Use load balancer for multiple instances
9. Configure CDN for static assets
10. Implement backup/disaster recovery

## Future Enhancements

### Short Term
1. Add user authentication
2. Implement conversation history persistence
3. Add more knowledge base categories
4. Improve error handling and user feedback
5. Add conversation analytics

### Medium Term
1. Multi-user support with user profiles
2. Custom voice training
3. Integration with CRM systems
4. Advanced analytics dashboard
5. Mobile app (React Native)

### Long Term
1. Multi-modal support (video, images)
2. Sentiment analysis
3. Real-time translation
4. Voice biometrics
5. AI agent orchestration

## Code Quality Assessment

### Strengths
- Well-structured TypeScript with strong typing
- Clear separation of concerns
- Modular tool system
- Good error handling in critical paths
- Comprehensive event system

### Areas for Improvement
- Add JSDoc comments
- Implement automated testing
- Add input validation
- Improve error messages
- Add logging framework
- Implement metrics collection
- Add code linting (ESLint)
- Add code formatting (Prettier)
- Implement dependency injection
- Add configuration validation

## Conclusion

This is a well-architected real-time voice AI application leveraging Amazon Nova 2 Sonic's capabilities. The codebase is clean, modular, and extensible. The main areas needing attention are:

1. **Testing** - No automated tests currently
2. **Security** - Needs authentication and authorization
3. **Monitoring** - Add observability and metrics
4. **Documentation** - More inline comments and API docs
5. **Error Handling** - More robust error recovery

The knowledge base integration is now properly configured and should work with the electricity service prompt. The tool system is flexible and easy to extend with new capabilities.

**Overall Assessment: 7.5/10**
- Architecture: 9/10
- Code Quality: 8/10
- Documentation: 6/10
- Testing: 2/10
- Security: 5/10
- Performance: 8/10
