/**
 * Guardrails Service - Content filtering, prompt protection, and grounding
 */

import { GuardrailsConfig, ViolationType, GuardrailResult } from '../config/guardrails';

export class GuardrailsService {
    private static instance: GuardrailsService;
    private requestCounts: Map<string, { count: number; timestamp: number; total: number }> = new Map();

    private constructor() {
        // Cleanup old rate limit entries every 5 minutes
        setInterval(() => this.cleanupRateLimits(), 5 * 60 * 1000);
    }

    public static getInstance(): GuardrailsService {
        if (!GuardrailsService.instance) {
            GuardrailsService.instance = new GuardrailsService();
        }
        return GuardrailsService.instance;
    }

    /**
     * Main guardrail check for user input
     */
    public checkUserInput(input: string, sessionId: string): GuardrailResult {
        if (!GuardrailsConfig.enabled) {
            return { allowed: true, severity: 'low' };
        }

        // 1. Check rate limiting
        const rateLimitResult = this.checkRateLimit(sessionId);
        if (!rateLimitResult.allowed) {
            return rateLimitResult;
        }

        // 2. Check for prompt injection
        const injectionResult = this.checkPromptInjection(input);
        if (!injectionResult.allowed) {
            this.logViolation(sessionId, ViolationType.PROMPT_INJECTION, input);
            return injectionResult;
        }

        // 3. Check for PII
        const piiResult = this.checkPII(input);
        if (!piiResult.allowed) {
            this.logViolation(sessionId, ViolationType.PII_DETECTED, input);
            return piiResult;
        }

        // 4. Check for blocked content
        const contentResult = this.checkBlockedContent(input);
        if (!contentResult.allowed) {
            this.logViolation(sessionId, ViolationType.BLOCKED_CONTENT, input);
            return contentResult;
        }

        // 5. Check if on-topic (grounding)
        const groundingResult = this.checkGrounding(input);
        if (!groundingResult.allowed) {
            this.logViolation(sessionId, ViolationType.OFF_TOPIC, input);
            return groundingResult;
        }

        // 6. Check for escalation triggers
        const escalationResult = this.checkEscalation(input);
        if (escalationResult.shouldEscalate) {
            this.logViolation(sessionId, ViolationType.ESCALATION_TRIGGER, input);
            return escalationResult;
        }

        return { allowed: true, severity: 'low' };
    }

    /**
     * Check assistant response before sending to user
     */
    public checkAssistantResponse(response: string, sessionId: string): GuardrailResult {
        if (!GuardrailsConfig.enabled || !GuardrailsConfig.responseValidation.enabled) {
            return { allowed: true, severity: 'low' };
        }

        // Check response length
        if (response.length > GuardrailsConfig.responseValidation.maxLength) {
            return {
                allowed: false,
                violationType: ViolationType.RESPONSE_TOO_LONG,
                message: 'Response too long, truncating...',
                severity: 'low',
                details: `Response length: ${response.length}, max: ${GuardrailsConfig.responseValidation.maxLength}`
            };
        }

        // Check for PII leakage in response
        const piiResult = this.detectPII(response);
        if (piiResult.detected) {
            console.warn(`PII detected in assistant response for session ${sessionId}`);
            // Don't block, but log for monitoring
        }

        return { allowed: true, severity: 'low' };
    }

    /**
     * Check for prompt injection attempts
     */
    private checkPromptInjection(input: string): GuardrailResult {
        if (!GuardrailsConfig.promptProtection.enabled) {
            return { allowed: true, severity: 'low' };
        }

        const patterns = GuardrailsConfig.promptProtection.suspiciousPatterns;
        
        for (const pattern of patterns) {
            if (pattern.test(input)) {
                return {
                    allowed: false,
                    violationType: ViolationType.PROMPT_INJECTION,
                    message: GuardrailsConfig.promptProtection.rejectionMessage,
                    severity: 'high',
                    details: `Matched pattern: ${pattern.source}`
                };
            }
        }

        return { allowed: true, severity: 'low' };
    }

    /**
     * Check for personally identifiable information
     */
    private checkPII(input: string): GuardrailResult {
        if (!GuardrailsConfig.piiProtection.enabled) {
            return { allowed: true, severity: 'low' };
        }

        const piiResult = this.detectPII(input);
        
        if (piiResult.detected) {
            return {
                allowed: false,
                violationType: ViolationType.PII_DETECTED,
                message: GuardrailsConfig.piiProtection.warningMessage,
                severity: 'medium',
                details: `Detected PII types: ${piiResult.types.join(', ')}`
            };
        }

        return { allowed: true, severity: 'low' };
    }

    /**
     * Detect PII in text
     */
    private detectPII(text: string): { detected: boolean; types: string[] } {
        const patterns = GuardrailsConfig.piiProtection.patterns;
        const detectedTypes: string[] = [];

        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) {
                detectedTypes.push(type);
            }
        }

        return {
            detected: detectedTypes.length > 0,
            types: detectedTypes
        };
    }

    /**
     * Check for blocked content
     */
    private checkBlockedContent(input: string): GuardrailResult {
        if (!GuardrailsConfig.contentFilter.enabled) {
            return { allowed: true, severity: 'low' };
        }

        const lowerInput = input.toLowerCase();
        const keywords = GuardrailsConfig.contentFilter.sensitiveKeywords;

        for (const keyword of keywords) {
            if (lowerInput.includes(keyword.toLowerCase())) {
                return {
                    allowed: false,
                    violationType: ViolationType.BLOCKED_CONTENT,
                    message: GuardrailsConfig.contentFilter.blockedContentMessage,
                    severity: 'high',
                    details: `Blocked keyword: ${keyword}`
                };
            }
        }

        return { allowed: true, severity: 'low' };
    }

    /**
     * Check if query is on-topic (grounding)
     */
    private checkGrounding(input: string): GuardrailResult {
        if (!GuardrailsConfig.grounding.enabled) {
            return { allowed: true, severity: 'low' };
        }

        const lowerInput = input.toLowerCase();
        const relevantKeywords = GuardrailsConfig.grounding.relevantKeywords;

        // Check if input contains any relevant keywords
        const hasRelevantKeyword = relevantKeywords.some(keyword => 
            lowerInput.includes(keyword.toLowerCase())
        );

        // If input is very short (greeting, etc.), allow it
        if (input.trim().split(/\s+/).length <= 3) {
            return { allowed: true, severity: 'low' };
        }

        // If no relevant keywords found, it's likely off-topic
        if (!hasRelevantKeyword) {
            return {
                allowed: false,
                violationType: ViolationType.OFF_TOPIC,
                message: GuardrailsConfig.grounding.offTopicMessage,
                severity: 'medium',
                details: 'No electricity service-related keywords detected'
            };
        }

        return { allowed: true, severity: 'low' };
    }

    /**
     * Check for escalation triggers
     */
    private checkEscalation(input: string): GuardrailResult {
        if (!GuardrailsConfig.escalation.enabled) {
            return { allowed: true, severity: 'low' };
        }

        const lowerInput = input.toLowerCase();
        const triggers = GuardrailsConfig.escalation.triggers;

        for (const trigger of triggers) {
            if (lowerInput.includes(trigger.toLowerCase())) {
                return {
                    allowed: true, // Allow but flag for escalation
                    violationType: ViolationType.ESCALATION_TRIGGER,
                    message: GuardrailsConfig.escalation.escalationMessage,
                    severity: 'high',
                    shouldEscalate: true,
                    details: `Escalation trigger: ${trigger}`
                };
            }
        }

        return { allowed: true, severity: 'low' };
    }

    /**
     * Check rate limiting
     */
    private checkRateLimit(sessionId: string): GuardrailResult {
        if (!GuardrailsConfig.rateLimiting.enabled) {
            return { allowed: true, severity: 'low' };
        }

        const now = Date.now();
        const entry = this.requestCounts.get(sessionId);

        if (!entry) {
            this.requestCounts.set(sessionId, { count: 1, timestamp: now, total: 1 });
            return { allowed: true, severity: 'low' };
        }

        // Check per-minute rate limit
        const timeDiff = now - entry.timestamp;
        if (timeDiff < 60000) { // Within 1 minute
            entry.count++;
            if (entry.count > GuardrailsConfig.rateLimiting.maxRequestsPerMinute) {
                return {
                    allowed: false,
                    violationType: ViolationType.RATE_LIMIT,
                    message: GuardrailsConfig.rateLimiting.cooldownMessage,
                    severity: 'medium',
                    details: `Exceeded ${GuardrailsConfig.rateLimiting.maxRequestsPerMinute} requests per minute`
                };
            }
        } else {
            // Reset minute counter
            entry.count = 1;
            entry.timestamp = now;
        }

        // Check per-session rate limit
        entry.total++;
        if (entry.total > GuardrailsConfig.rateLimiting.maxRequestsPerSession) {
            return {
                allowed: false,
                violationType: ViolationType.RATE_LIMIT,
                message: 'Session limit reached. Please start a new conversation.',
                severity: 'high',
                details: `Exceeded ${GuardrailsConfig.rateLimiting.maxRequestsPerSession} requests per session`
            };
        }

        return { allowed: true, severity: 'low' };
    }

    /**
     * Cleanup old rate limit entries
     */
    private cleanupRateLimits(): void {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        for (const [sessionId, entry] of this.requestCounts.entries()) {
            if (now - entry.timestamp > fiveMinutes) {
                this.requestCounts.delete(sessionId);
            }
        }
    }

    /**
     * Log guardrail violations
     */
    private logViolation(sessionId: string, type: ViolationType, input: string): void {
        if (!GuardrailsConfig.logging.enabled || !GuardrailsConfig.logging.logViolations) {
            return;
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            sessionId,
            violationType: type,
            inputLength: input.length,
            inputPreview: input.substring(0, 100) // Log first 100 chars only
        };

        console.warn('[GUARDRAIL VIOLATION]', JSON.stringify(logEntry));
    }

    /**
     * Mask PII in text
     */
    public maskPII(text: string): string {
        if (!GuardrailsConfig.piiProtection.enabled) {
            return text;
        }

        let maskedText = text;
        const patterns = GuardrailsConfig.piiProtection.patterns;
        const maskChar = GuardrailsConfig.piiProtection.maskChar;

        for (const [type, pattern] of Object.entries(patterns)) {
            maskedText = maskedText.replace(pattern, (match) => {
                // Keep first and last 2 characters, mask the rest
                if (match.length <= 4) {
                    return maskChar.repeat(match.length);
                }
                return match.substring(0, 2) + maskChar.repeat(match.length - 4) + match.substring(match.length - 2);
            });
        }

        return maskedText;
    }

    /**
     * Reset rate limit for a session
     */
    public resetRateLimit(sessionId: string): void {
        this.requestCounts.delete(sessionId);
    }

    /**
     * Get session statistics
     */
    public getSessionStats(sessionId: string): { total: number; perMinute: number } | null {
        const entry = this.requestCounts.get(sessionId);
        if (!entry) {
            return null;
        }

        return {
            total: entry.total,
            perMinute: entry.count
        };
    }
}
