/**
 * Knowledge Base type definitions
 */

export interface KnowledgeBaseEntry {
    id: string;
    title: string;
    content: string;
    category: KnowledgeCategory;
    tags: string[];
    source: string;
    lastUpdated: string;
    metadata?: {
        author?: string;
        version?: string;
        department?: string;
        [key: string]: any;
    };
}

export type KnowledgeCategory = 
    | 'policies' 
    | 'procedures' 
    | 'faq' 
    | 'technical' 
    | 'general'
    | 'company-info'
    | 'products'
    | 'support';

export interface SearchResult {
    entry: KnowledgeBaseEntry;
    score: number;
    matchedFields: string[];
}

export interface KnowledgeBaseIndex {
    entries: KnowledgeBaseEntry[];
    categories: KnowledgeCategory[];
    lastUpdated: string;
    version: string;
}

export interface SearchOptions {
    category?: KnowledgeCategory;
    tags?: string[];
    limit?: number;
    minScore?: number;
}