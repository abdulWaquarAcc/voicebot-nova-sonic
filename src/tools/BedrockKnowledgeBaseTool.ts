/**
 * BedrockKnowledgeBaseTool - Search Bedrock Knowledge Base for information
 */
import { Tool } from './Tool';
import { BedrockKnowledgeBaseService } from '../lib/BedrockKnowledgeBaseService';
import { KnowledgeBaseConfig } from '../config/knowledge-base';

interface BedrockKBParams {
    query: string;
    category?: string;
    limit?: number;
}

function parseParams(params: unknown): BedrockKBParams {
    const content = params as BedrockKBParams;
    return {
        query: content.query || '',
        category: content.category,
        limit: content.limit || 3
    };
}

export const BedrockKnowledgeBaseTool: Tool = {
    name: 'searchBedrockKnowledgeBase',
    description: `Search the company knowledge base powered by Amazon Bedrock for policies, procedures, FAQs, and general company information. Use this when users ask about company-specific information. Categories available: ${Object.keys(KnowledgeBaseConfig.categories).join(', ')}.`,

    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Search query for the knowledge base. Use natural language related to what the user is asking about.'
            },
            category: {
                type: 'string',
                enum: Object.keys(KnowledgeBaseConfig.categories),
                description: 'Optional category to provide context for the search.'
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
            const service = BedrockKnowledgeBaseService.getInstance();

            const searchResults = await service.search(parsed.query, {
                category: parsed.category as any,
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

            const formattedResults = searchResults.map(result => {
                let content = result.entry.content;
                const maxLength = KnowledgeBaseConfig.search.contentLimit;

                if (content.length > maxLength) {
                    const truncated = content.substring(0, maxLength);
                    const lastSentence = truncated.lastIndexOf('.');
                    if (lastSentence > maxLength * 0.7) {
                        content = truncated.substring(0, lastSentence + 1);
                    } else {
                        content = truncated + '...';
                    }
                }

                return {
                    id: result.entry.id,
                    title: result.entry.title,
                    content: content,
                    source: result.entry.source,
                    relevanceScore: Math.round(result.score * 100) / 100
                };
            });

            console.log(`Bedrock KB search: "${parsed.query}" returned ${formattedResults.length} results`);

            return {
                query: parsed.query,
                category: parsed.category,
                totalResults: formattedResults.length,
                results: formattedResults,
                searchInfo: {
                    searchedCategory: parsed.category || 'all categories',
                    maxResults: parsed.limit || 3,
                    provider: 'Amazon Bedrock Knowledge Base'
                }
            };

        } catch (error) {
            console.error('Error searching Bedrock Knowledge Base:', error);

            return {
                error: true,
                message: 'An error occurred while searching the Bedrock knowledge base',
                query: parsed.query,
                details: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
};
