/**
 * KnowledgeBaseTool - Search company knowledge base for information
 */
import { Tool } from './Tool';
import { KnowledgeBaseService } from '../lib/KnowledgeBaseService';
import { KnowledgeCategory } from '../types/knowledge';
import { KnowledgeBaseConfig } from '../config/knowledge-base';

interface KnowledgeBaseParams {
    query: string;
    category?: KnowledgeCategory;
    limit?: number;
}

function parseParams(params: unknown): KnowledgeBaseParams {
    const content = params as KnowledgeBaseParams;
    return {
        query: content.query || '',
        category: content.category,
        limit: content.limit || 3
    };
}

export const KnowledgeBaseTool: Tool = {
    name: 'searchKnowledgeBase',
    description: `Search the company knowledge base for policies, procedures, FAQs, technical documentation, and general company information. Use this when users ask about company-specific information, policies, procedures, or need help with internal processes. Categories available: ${Object.keys(KnowledgeBaseConfig.categories).join(', ')}.`,
    
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Search query for the knowledge base. Use specific keywords related to what the user is asking about.'
            },
            category: {
                type: 'string',
                enum: Object.keys(KnowledgeBaseConfig.categories),
                description: 'Optional category to narrow down the search. Choose the most relevant category for the query.'
            },
            limit: {
                type: 'number',
                minimum: 1,
                maximum: 10,
                description: 'Maximum number of results to return (default: 3, max: 10)'
            }
        },
        required: ['query']
    },

    async execute(params: unknown): Promise<object> {
        const parsed = parseParams(params);
        
        if (!parsed.query || !parsed.query.trim()) {
            return {
                error: true,
                message: 'Search query is required'
            };
        }

        try {
            const knowledgeBaseService = KnowledgeBaseService.getInstance();
            
            const searchResults = await knowledgeBaseService.search(parsed.query, {
                category: parsed.category,
                limit: Math.min(parsed.limit || 3, 10)
            });

            if (searchResults.length === 0) {
                return {
                    query: parsed.query,
                    category: parsed.category,
                    results: [],
                    message: 'No relevant information found in the knowledge base for this query.'
                };
            }

            // Format results for voice response
            const formattedResults = searchResults.map(result => {
                const entry = result.entry;
                
                // Truncate content for voice response
                let content = entry.content;
                const maxLength = KnowledgeBaseConfig.search.contentLimit;
                
                if (content.length > maxLength) {
                    // Try to cut at a sentence boundary
                    const truncated = content.substring(0, maxLength);
                    const lastSentence = truncated.lastIndexOf('.');
                    if (lastSentence > maxLength * 0.7) {
                        content = truncated.substring(0, lastSentence + 1);
                    } else {
                        content = truncated + '...';
                    }
                }

                return {
                    id: entry.id,
                    title: entry.title,
                    content: content,
                    category: entry.category,
                    tags: entry.tags,
                    source: entry.source,
                    relevanceScore: Math.round(result.score * 100) / 100,
                    matchedFields: result.matchedFields,
                    lastUpdated: entry.lastUpdated
                };
            });

            console.log(`Knowledge base search: "${parsed.query}" returned ${formattedResults.length} results`);

            return {
                query: parsed.query,
                category: parsed.category,
                totalResults: formattedResults.length,
                results: formattedResults,
                searchInfo: {
                    searchedCategory: parsed.category || 'all categories',
                    maxResults: parsed.limit || 3
                }
            };

        } catch (error) {
            console.error('Error searching knowledge base:', error);
            
            return {
                error: true,
                message: 'An error occurred while searching the knowledge base',
                query: parsed.query,
                details: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
};