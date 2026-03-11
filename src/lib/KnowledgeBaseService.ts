/**
 * Knowledge Base Service - Handles searching and retrieving knowledge base entries
 */

import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeBaseEntry, KnowledgeBaseIndex, SearchResult, SearchOptions, KnowledgeCategory } from '../types/knowledge';
import { KnowledgeBaseConfig } from '../config/knowledge-base';

export class KnowledgeBaseService {
    private static instance: KnowledgeBaseService;
    private knowledgeBase: KnowledgeBaseIndex | null = null;
    private lastLoadTime: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    private constructor() {}

    public static getInstance(): KnowledgeBaseService {
        if (!KnowledgeBaseService.instance) {
            KnowledgeBaseService.instance = new KnowledgeBaseService();
        }
        return KnowledgeBaseService.instance;
    }

    /**
     * Load knowledge base from file system
     */
    private async loadKnowledgeBase(): Promise<KnowledgeBaseIndex> {
        const now = Date.now();
        
        // Return cached version if still valid
        if (this.knowledgeBase && (now - this.lastLoadTime) < this.CACHE_DURATION) {
            return this.knowledgeBase;
        }

        try {
            const indexPath = path.resolve(KnowledgeBaseConfig.indexFile);
            
            if (!fs.existsSync(indexPath)) {
                console.warn('Knowledge base index not found, creating empty index');
                return this.createEmptyIndex();
            }

            const indexData = fs.readFileSync(indexPath, 'utf-8');
            this.knowledgeBase = JSON.parse(indexData);
            this.lastLoadTime = now;
            
            console.log(`Loaded knowledge base with ${this.knowledgeBase!.entries.length} entries`);
            return this.knowledgeBase!;
            
        } catch (error) {
            console.error('Error loading knowledge base:', error);
            return this.createEmptyIndex();
        }
    }

    /**
     * Create empty knowledge base index
     */
    private createEmptyIndex(): KnowledgeBaseIndex {
        return {
            entries: [],
            categories: ['general'],
            lastUpdated: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    /**
     * Search knowledge base entries
     */
    public async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
        const kb = await this.loadKnowledgeBase();
        
        if (!query.trim()) {
            return [];
        }

        const searchTerms = query.toLowerCase().split(/\s+/);
        const results: SearchResult[] = [];

        for (const entry of kb.entries) {
            // Skip if category filter doesn't match
            if (options.category && entry.category !== options.category) {
                continue;
            }

            // Skip if tags filter doesn't match
            if (options.tags && !options.tags.some(tag => entry.tags.includes(tag))) {
                continue;
            }

            const score = this.calculateRelevanceScore(entry, searchTerms);
            const minScore = options.minScore || KnowledgeBaseConfig.search.minScore;

            if (score >= minScore) {
                results.push({
                    entry,
                    score,
                    matchedFields: this.getMatchedFields(entry, searchTerms)
                });
            }
        }

        // Sort by relevance score (highest first)
        results.sort((a, b) => b.score - a.score);

        // Limit results
        const limit = options.limit || KnowledgeBaseConfig.search.maxResults;
        return results.slice(0, limit);
    }

    /**
     * Calculate relevance score for an entry
     */
    private calculateRelevanceScore(entry: KnowledgeBaseEntry, searchTerms: string[]): number {
        let score = 0;
        const weights = KnowledgeBaseConfig.searchWeights;

        for (const term of searchTerms) {
            // Title matches
            if (entry.title.toLowerCase().includes(term)) {
                score += weights.title;
            }

            // Content matches
            const contentMatches = (entry.content.toLowerCase().match(new RegExp(term, 'g')) || []).length;
            score += contentMatches * weights.content;

            // Tag matches
            for (const tag of entry.tags) {
                if (tag.toLowerCase().includes(term)) {
                    score += weights.tags;
                }
            }

            // Category matches
            if (entry.category.toLowerCase().includes(term)) {
                score += weights.category;
            }
        }

        // Normalize score by content length to favor concise, relevant content
        const contentLength = entry.content.length;
        const normalizedScore = contentLength > 0 ? score / Math.log(contentLength + 1) : score;

        return normalizedScore;
    }

    /**
     * Get fields that matched the search terms
     */
    private getMatchedFields(entry: KnowledgeBaseEntry, searchTerms: string[]): string[] {
        const matchedFields: string[] = [];

        for (const term of searchTerms) {
            if (entry.title.toLowerCase().includes(term)) {
                matchedFields.push('title');
            }
            if (entry.content.toLowerCase().includes(term)) {
                matchedFields.push('content');
            }
            if (entry.tags.some(tag => tag.toLowerCase().includes(term))) {
                matchedFields.push('tags');
            }
            if (entry.category.toLowerCase().includes(term)) {
                matchedFields.push('category');
            }
        }

        return [...new Set(matchedFields)]; // Remove duplicates
    }

    /**
     * Get entry by ID
     */
    public async getById(id: string): Promise<KnowledgeBaseEntry | null> {
        const kb = await this.loadKnowledgeBase();
        return kb.entries.find(entry => entry.id === id) || null;
    }

    /**
     * Get all categories
     */
    public async getCategories(): Promise<KnowledgeCategory[]> {
        const kb = await this.loadKnowledgeBase();
        return kb.categories;
    }

    /**
     * Get entries by category
     */
    public async getByCategory(category: KnowledgeCategory): Promise<KnowledgeBaseEntry[]> {
        const kb = await this.loadKnowledgeBase();
        return kb.entries.filter(entry => entry.category === category);
    }

    /**
     * Refresh knowledge base cache
     */
    public refreshCache(): void {
        this.knowledgeBase = null;
        this.lastLoadTime = 0;
    }
}