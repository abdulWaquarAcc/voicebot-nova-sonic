/**
 * Bedrock Knowledge Base Service - Uses Amazon Bedrock Knowledge Base for semantic search
 */

import { BedrockAgentRuntimeClient, RetrieveCommand, RetrieveCommandInput } from '@aws-sdk/client-bedrock-agent-runtime';
import { SearchResult, SearchOptions, KnowledgeBaseEntry } from '../types/knowledge';

export interface BedrockKBConfig {
    knowledgeBaseId: string;
    region: string;
}

const DEFAULT_CONFIG: BedrockKBConfig = {
    knowledgeBaseId: '9EUCX45UDQ',
    region: 'us-east-1'
};

export class BedrockKnowledgeBaseService {
    private static instance: BedrockKnowledgeBaseService;
    private client: BedrockAgentRuntimeClient;
    private config: BedrockKBConfig;

    private constructor(config: BedrockKBConfig = DEFAULT_CONFIG) {
        this.config = config;
        this.client = new BedrockAgentRuntimeClient({ region: this.config.region });
    }

    public static getInstance(config?: BedrockKBConfig): BedrockKnowledgeBaseService {
        if (!BedrockKnowledgeBaseService.instance) {
            BedrockKnowledgeBaseService.instance = new BedrockKnowledgeBaseService(config);
        }
        return BedrockKnowledgeBaseService.instance;
    }

    /**
     * Search the Bedrock Knowledge Base using semantic search
     */
    public async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        if (!query.trim()) {
            return [];
        }

        const limit = options.limit || 5;

        const input: RetrieveCommandInput = {
            knowledgeBaseId: this.config.knowledgeBaseId,
            retrievalQuery: { text: query },
            retrievalConfiguration: {
                vectorSearchConfiguration: {
                    numberOfResults: limit
                }
            }
        };

        try {
            const command = new RetrieveCommand(input);
            const response = await this.client.send(command);

            if (!response.retrievalResults || response.retrievalResults.length === 0) {
                return [];
            }

            const results: SearchResult[] = response.retrievalResults.map((result, index) => {
                const content = result.content?.text || '';
                const score = result.score || 0;
                const sourceUri = result.location?.s3Location?.uri || '';

                const entry: KnowledgeBaseEntry = {
                    id: `bedrock-${index}`,
                    title: this.extractTitle(content),
                    content: content,
                    category: options.category || 'general',
                    tags: [],
                    source: sourceUri,
                    lastUpdated: new Date().toISOString()
                };

                return {
                    entry,
                    score,
                    matchedFields: ['content']
                };
            });

            return results;

        } catch (error) {
            console.error('Error querying Bedrock Knowledge Base:', error);
            throw error;
        }
    }

    /**
     * Extract a title from the content (first line or first sentence)
     */
    private extractTitle(content: string): string {
        const firstLine = content.split('\n')[0].trim();
        if (firstLine.length <= 100) {
            return firstLine;
        }
        const firstSentence = content.split('.')[0].trim();
        return firstSentence.length <= 100 ? firstSentence : firstSentence.substring(0, 97) + '...';
    }
}
