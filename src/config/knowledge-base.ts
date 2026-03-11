/**
 * Knowledge Base Configuration
 */

export const KnowledgeBaseConfig = {
    // File paths
    dataPath: './data/knowledge-base',
    indexFile: './data/knowledge-base/index.json',
    
    // Search settings
    search: {
        maxResults: 5,
        minScore: 0.1,
        contentLimit: 2000, // Max characters for voice response
        enableFuzzySearch: true,
        caseSensitive: false
    },
    
    // Categories and their descriptions
    categories: {
        'outage': 'Power outage reporting and status',
        'service': 'Move or disconnect electricity service',
        'connection': 'New electricity connection requests',
        'payment': 'Bill payment and payment plans',
        'meter': 'Meter reading submission and inquiries'
    },
    
    // Search weights for different fields
    searchWeights: {
        title: 3.0,
        content: 1.0,
        tags: 2.0,
        category: 1.5
    }
};