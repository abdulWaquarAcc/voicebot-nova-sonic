# Knowledge Base

This directory contains the knowledge base files for the Nova Sonic voice assistant.

## Structure

- `index.json` - Main index file containing all knowledge base entries
- `sample-docs/` - Sample document files (optional, for reference)

## Adding New Content

### Method 1: Edit index.json directly
1. Open `index.json`
2. Add new entries to the `entries` array
3. Follow the existing format with required fields:
   - `id`: Unique identifier
   - `title`: Entry title
   - `content`: Main content (keep under 2000 chars for voice)
   - `category`: One of the predefined categories
   - `tags`: Array of searchable tags
   - `source`: Source document/manual
   - `lastUpdated`: ISO date string

### Method 2: Use the Knowledge Base Manager (Future)
A web interface for managing knowledge base entries will be added later.

## Categories

- `policies` - Company policies and guidelines
- `procedures` - Step-by-step procedures and workflows  
- `faq` - Frequently asked questions and answers
- `technical` - Technical documentation and guides
- `general` - General company information
- `company-info` - About the company, history, mission
- `products` - Product information and specifications
- `support` - Customer support and troubleshooting

## Search Tips

The knowledge base supports:
- Full-text search across title, content, and tags
- Category filtering
- Relevance scoring based on keyword matches
- Fuzzy matching for typos

## Content Guidelines

1. **Keep content concise** - Aim for under 2000 characters per entry
2. **Use clear titles** - Make them descriptive and searchable
3. **Add relevant tags** - Include synonyms and related terms
4. **Choose appropriate categories** - Helps users find information faster
5. **Update regularly** - Keep information current and accurate

## Example Entry

```json
{
  "id": "unique-id-001",
  "title": "How to Submit Time Off Requests",
  "content": "To request time off: 1) Log into the HR portal. 2) Click 'Time Off Request'. 3) Select dates and type (vacation, sick, personal). 4) Add a note if needed. 5) Submit for manager approval. Requests should be submitted at least 2 weeks in advance for vacation time.",
  "category": "procedures",
  "tags": ["time off", "vacation", "PTO", "HR", "requests"],
  "source": "HR Procedures Manual v3.1",
  "lastUpdated": "2024-01-15T10:00:00Z",
  "metadata": {
    "author": "HR Department",
    "department": "Human Resources"
  }
}
```