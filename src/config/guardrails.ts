/**
 * Guardrails Configuration
 * Implements content filtering, prompt protection, and grounding rules
 */

export const GuardrailsConfig = {
    // Enable/disable guardrails
    enabled: true,
    
    // Prompt injection protection
    promptProtection: {
        enabled: true,
        // Patterns that indicate prompt injection attempts
        suspiciousPatterns: [
            /ignore\s+(previous|all|above)\s+(instructions|prompts|rules)/gi,
            /forget\s+(everything|all|previous)/gi,
            /you\s+are\s+now\s+a/gi,
            /new\s+(instructions|role|persona)/gi,
            /system\s*:\s*/gi,
            /\[SYSTEM\]/gi,
            /\<\|system\|\>/gi,
            /disregard\s+(previous|all)/gi,
            /override\s+(instructions|settings)/gi,
            /reveal\s+(your|the)\s+(prompt|instructions|system)/gi,
            /what\s+(are|is)\s+your\s+(instructions|prompt|rules)/gi,
        ],
        // Response when injection detected
        rejectionMessage: "I'm here to help with electricity service questions. Could you please rephrase your question?"
    },

    // Content filtering
    contentFilter: {
        enabled: true,
        // Blocked topics
        blockedTopics: [
            'politics',
            'religion',
            'violence',
            'illegal activities',
            'adult content',
            'hate speech',
            'personal attacks',
            'medical advice',
            'legal advice',
            'financial advice'
        ],
        // Sensitive keywords to flag
        sensitiveKeywords: [
            'hack', 'exploit', 'bypass', 'crack',
            'steal', 'fraud', 'scam', 'cheat',
            'kill', 'harm', 'attack', 'weapon',
            'drug', 'illegal', 'criminal'
        ],
        // Response for blocked content
        blockedContentMessage: "I can only assist with electricity service-related questions. How can I help you with your power service today?"
    },

    // Grounding rules - keep responses focused on electricity utility
    grounding: {
        enabled: true,
        // Allowed topics
        allowedTopics: [
            'power outage',
            'electricity service',
            'billing',
            'payment',
            'meter reading',
            'new connection',
            'disconnect service',
            'move service',
            'account information',
            'service address',
            'customer service',
            'contact information',
            'service hours',
            'emergency reporting',
            'power restoration',
            'service fees',
            'deposit',
            'payment plan',
            'bill copy',
            'statement'
        ],
        // Keywords that indicate on-topic queries
        relevantKeywords: [
            'power', 'electricity', 'electric', 'energy',
            'outage', 'blackout', 'service', 'utility',
            'bill', 'payment', 'account', 'meter',
            'connection', 'disconnect', 'move', 'transfer',
            'kwh', 'kilowatt', 'voltage', 'current',
            'line', 'pole', 'transformer', 'grid'
        ],
        // Response for off-topic queries
        offTopicMessage: "I specialize in electricity service questions. For other inquiries, please contact our general customer service. How can I help with your electricity service?"
    },

    // Personal information protection
    piiProtection: {
        enabled: true,
        // PII patterns to detect and mask
        patterns: {
            ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
            creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
            accountNumber: /\b(account|acct)[\s#:]*\d{8,12}\b/gi
        },
        // Mask character
        maskChar: '*',
        // Warning message
        warningMessage: "For security, please don't share sensitive personal information like account numbers, SSN, or credit card details over voice. Our agents can securely access your information when you call."
    },

    // Response validation
    responseValidation: {
        enabled: true,
        // Max response length (characters)
        maxLength: 500,
        // Ensure responses stay professional
        professionalTone: true,
        // Require knowledge base citation for factual claims
        requireCitation: false
    },

    // Rate limiting
    rateLimiting: {
        enabled: true,
        // Max requests per session
        maxRequestsPerSession: 50,
        // Max requests per minute
        maxRequestsPerMinute: 10,
        // Cooldown message
        cooldownMessage: "You're asking questions very quickly. Please take a moment, and I'll be happy to help you."
    },

    // Escalation triggers
    escalation: {
        enabled: true,
        // Triggers that should escalate to human agent
        triggers: [
            'emergency',
            'urgent',
            'complaint',
            'angry',
            'frustrated',
            'manager',
            'supervisor',
            'legal',
            'lawsuit',
            'lawyer',
            'attorney',
            'discrimination',
            'harassment'
        ],
        escalationMessage: "I understand this is important. Let me connect you with a customer service agent who can better assist you. Please hold."
    },

    // Logging and monitoring
    logging: {
        enabled: true,
        logViolations: true,
        logPIIDetection: true,
        logEscalations: true,
        logOffTopicQueries: true
    }
};

/**
 * Guardrail violation types
 */
export enum ViolationType {
    PROMPT_INJECTION = 'prompt_injection',
    BLOCKED_CONTENT = 'blocked_content',
    OFF_TOPIC = 'off_topic',
    PII_DETECTED = 'pii_detected',
    RATE_LIMIT = 'rate_limit',
    ESCALATION_TRIGGER = 'escalation_trigger',
    RESPONSE_TOO_LONG = 'response_too_long'
}

/**
 * Guardrail check result
 */
export interface GuardrailResult {
    allowed: boolean;
    violationType?: ViolationType;
    message?: string;
    severity: 'low' | 'medium' | 'high';
    details?: string;
    shouldEscalate?: boolean;
}
