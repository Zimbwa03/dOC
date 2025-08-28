interface ResearchResult {
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  doi?: string;
  url?: string;
  relevanceScore: number;
}

interface SearchQuery {
  query: string;
  type: 'general' | 'clinical_trial' | 'systematic_review' | 'guidelines';
  limit?: number;
}

class MedicalResearchService {
  private tavilyApiKey: string;
  private serpApiKey: string;

  constructor() {
    this.tavilyApiKey = process.env.TAVILY_API_KEY || '';
    this.serpApiKey = process.env.SERP_API_KEY || '';
  }

  async searchMedicalLiterature(query: string, type: string = 'general', limit: number = 10): Promise<ResearchResult[]> {
    try {
      // Try Tavily API first for medical research
      if (this.tavilyApiKey) {
        return await this.searchWithTavily(query, type, limit);
      }
      
      // Fallback to SerpAPI for PubMed search
      if (this.serpApiKey) {
        return await this.searchWithSerpAPI(query, type, limit);
      }

      // If no APIs are configured, return mock results for development
      console.warn('No medical research APIs configured - returning mock results');
      return this.getMockResults(query, type, limit);
      
    } catch (error) {
      console.error('Medical research search error:', error);
      return [];
    }
  }

  private async searchWithTavily(query: string, type: string, limit: number): Promise<ResearchResult[]> {
    try {
      const searchQuery = this.buildTavilyQuery(query, type);
      
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.tavilyApiKey}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          search_depth: 'advanced',
          include_domains: ['pubmed.ncbi.nlm.nih.gov', 'ncbi.nlm.nih.gov', 'nejm.org', 'thelancet.com', 'bmj.com'],
          max_results: limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseTavilyResults(data.results || []);
    } catch (error) {
      console.error('Tavily search error:', error);
      return [];
    }
  }

  private async searchWithSerpAPI(query: string, type: string, limit: number): Promise<ResearchResult[]> {
    try {
      const searchQuery = this.buildPubMedQuery(query, type);
      
      const response = await fetch(`https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(searchQuery)}&api_key=${this.serpApiKey}&num=${limit}`);
      
      if (!response.ok) {
        throw new Error(`SerpAPI error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseSerpAPIResults(data.organic_results || []);
    } catch (error) {
      console.error('SerpAPI search error:', error);
      return [];
    }
  }

  private buildTavilyQuery(query: string, type: string): string {
    let searchQuery = query;
    
    switch (type) {
      case 'clinical_trial':
        searchQuery += ' clinical trial randomized controlled';
        break;
      case 'systematic_review':
        searchQuery += ' systematic review meta-analysis';
        break;
      case 'guidelines':
        searchQuery += ' clinical guidelines recommendations';
        break;
      default:
        searchQuery += ' medical research';
    }
    
    return searchQuery;
  }

  private buildPubMedQuery(query: string, type: string): string {
    let searchQuery = `site:pubmed.ncbi.nlm.nih.gov ${query}`;
    
    switch (type) {
      case 'clinical_trial':
        searchQuery += ' "clinical trial" OR "randomized controlled trial"';
        break;
      case 'systematic_review':
        searchQuery += ' "systematic review" OR "meta-analysis"';
        break;
      case 'guidelines':
        searchQuery += ' "guidelines" OR "recommendations"';
        break;
    }
    
    return searchQuery;
  }

  private parseTavilyResults(results: any[]): ResearchResult[] {
    return results.map((result, index) => ({
      title: result.title || 'Unknown Title',
      abstract: result.content || result.snippet || 'No abstract available',
      authors: this.extractAuthors(result.content || ''),
      journal: this.extractJournal(result.url || ''),
      publicationDate: this.extractDate(result.content || ''),
      url: result.url,
      relevanceScore: Math.max(0.9 - (index * 0.1), 0.1), // Decreasing relevance
    }));
  }

  private parseSerpAPIResults(results: any[]): ResearchResult[] {
    return results.map((result, index) => ({
      title: result.title || 'Unknown Title',
      abstract: result.snippet || 'No abstract available',
      authors: this.extractAuthors(result.snippet || ''),
      journal: this.extractJournal(result.link || ''),
      publicationDate: this.extractDate(result.snippet || ''),
      url: result.link,
      relevanceScore: Math.max(0.9 - (index * 0.1), 0.1),
    }));
  }

  private extractAuthors(content: string): string[] {
    // Simple author extraction - could be enhanced with better parsing
    const authorPattern = /([A-Z][a-z]+ [A-Z][a-z]+(?:,\s*[A-Z][a-z]+ [A-Z][a-z]+)*)/;
    const match = content.match(authorPattern);
    return match ? match[1].split(',').map(author => author.trim()) : ['Unknown Author'];
  }

  private extractJournal(url: string): string {
    // Extract journal name from URL
    if (url.includes('nejm.org')) return 'New England Journal of Medicine';
    if (url.includes('thelancet.com')) return 'The Lancet';
    if (url.includes('bmj.com')) return 'BMJ';
    if (url.includes('pubmed.ncbi.nlm.nih.gov')) return 'PubMed Database';
    return 'Medical Journal';
  }

  private extractDate(content: string): string {
    // Simple date extraction
    const datePattern = /(\d{4})/;
    const match = content.match(datePattern);
    return match ? match[1] : new Date().getFullYear().toString();
  }

  private getMockResults(query: string, type: string, limit: number): ResearchResult[] {
    // Mock results for development when APIs are not configured
    const mockResults: ResearchResult[] = [
      {
        title: `Clinical Study on ${query}: A Comprehensive Review`,
        abstract: `This study examines the clinical aspects of ${query} and provides evidence-based recommendations for healthcare practitioners. The research was conducted across multiple healthcare institutions and provides valuable insights for medical professionals.`,
        authors: ['Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Rodriguez'],
        journal: 'Journal of Medical Research',
        publicationDate: '2024',
        url: 'https://pubmed.ncbi.nlm.nih.gov/example1',
        relevanceScore: 0.95,
      },
      {
        title: `Evidence-Based Treatment Approaches for ${query}`,
        abstract: `A systematic review of current treatment modalities and their effectiveness in managing ${query}. This meta-analysis includes data from over 50 clinical trials and provides clear guidelines for practitioners.`,
        authors: ['Prof. David Wilson', 'Dr. Lisa Anderson'],
        journal: 'Clinical Medicine Today',
        publicationDate: '2024',
        url: 'https://pubmed.ncbi.nlm.nih.gov/example2',
        relevanceScore: 0.88,
      },
      {
        title: `Latest Guidelines for ${query} Management`,
        abstract: `Updated clinical guidelines from the medical association providing comprehensive recommendations for diagnosis, treatment, and patient care related to ${query}.`,
        authors: ['Medical Advisory Committee'],
        journal: 'Healthcare Guidelines Quarterly',
        publicationDate: '2024',
        url: 'https://pubmed.ncbi.nlm.nih.gov/example3',
        relevanceScore: 0.82,
      },
    ];

    return mockResults.slice(0, limit);
  }

  async searchClinicalTrials(condition: string, location?: string): Promise<any[]> {
    try {
      // This would integrate with ClinicalTrials.gov API
      console.log(`Searching clinical trials for ${condition}${location ? ` in ${location}` : ''}`);
      
      // Mock implementation
      return [
        {
          title: `Phase III Trial for ${condition} Treatment`,
          status: 'Recruiting',
          location: location || 'Multiple Locations',
          eligibility: 'Adults 18-65 years old',
          description: `A randomized controlled trial studying new treatment approaches for ${condition}.`,
          contact: 'clinicaltrials@example.com',
        }
      ];
    } catch (error) {
      console.error('Clinical trials search error:', error);
      return [];
    }
  }

  async getEvidenceBasedGuidelines(condition: string): Promise<any[]> {
    try {
      // This would integrate with medical guideline databases
      console.log(`Fetching evidence-based guidelines for ${condition}`);
      
      // Mock implementation
      return [
        {
          title: `Clinical Practice Guidelines for ${condition}`,
          organization: 'American Medical Association',
          lastUpdated: '2024',
          recommendations: [
            'First-line treatment approach',
            'Diagnostic criteria and methods',
            'Patient monitoring guidelines',
            'Follow-up care recommendations'
          ],
          evidenceLevel: 'Grade A',
        }
      ];
    } catch (error) {
      console.error('Guidelines search error:', error);
      return [];
    }
  }
}

export const medicalResearchService = new MedicalResearchService();
