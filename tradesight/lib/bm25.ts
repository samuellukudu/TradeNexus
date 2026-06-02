export class BM25 {
  corpus: { id: string, text: string }[];
  termFrequencies: Map<string, Map<string, number>>; // docId -> term -> freq
  documentFrequencies: Map<string, number>; // term -> doc freq
  documentLengths: Map<string, number>; // docId -> length
  averageDocumentLength: number;
  k1: number;
  b: number;

  constructor(corpus: { id: string, text: string }[], k1 = 1.2, b = 0.75) {
    this.corpus = corpus;
    this.k1 = k1;
    this.b = b;
    this.termFrequencies = new Map();
    this.documentFrequencies = new Map();
    this.documentLengths = new Map();

    let totalLength = 0;

    for (const doc of corpus) {
      const tokens = this.tokenizeDoc(doc);
      
      const termFreq = new Map<string, number>();
      for (const token of tokens) {
        termFreq.set(token, (termFreq.get(token) || 0) + 1);
      }

      this.termFrequencies.set(doc.id, termFreq);
      this.documentLengths.set(doc.id, tokens.length);
      totalLength += tokens.length;

      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        this.documentFrequencies.set(token, (this.documentFrequencies.get(token) || 0) + 1);
      }
    }

    this.averageDocumentLength = corpus.length > 0 ? totalLength / corpus.length : 0;
  }

  tokenizeString(text: string): string[] {
    const textLower = text.toLowerCase();
    const tokens: string[] = [];
    
    try {
      // Modern regex matching English words/digits or individual CJK characters
      const regex = /[a-z0-9]+|\p{Unified_Ideograph}|\p{Script=Hangul}|\p{Script=Hiragana}|\p{Script=Katakana}/gu;
      let match;
      while ((match = regex.exec(textLower)) !== null) {
        tokens.push(match[0]);
      }
    } catch (e) {
      // Fallback regex matching English words/digits or basic Han characters
      const fallbackRegex = /[a-z0-9]+|[\u4e00-\u9fa5]/g;
      let match;
      while ((match = fallbackRegex.exec(textLower)) !== null) {
        tokens.push(match[0]);
      }
    }
    
    return tokens;
  }
  
  tokenizeDoc(doc: { id: string, text: string }): string[] {
    const tokens = this.tokenizeString(doc.text);
    tokens.push(doc.id.toLowerCase());
    return tokens;
  }

  search(query: string): { id: string, score: number, item: any }[] {
    const queryTokens = this.tokenizeString(query);
    const N = this.corpus.length;
    
    // Using a Map for scores since it's faster for sparse updates
    const scores = new Map<string, number>();

    for (const token of queryTokens) {
      const df = this.documentFrequencies.get(token) || 0;
      // Skip if term doesn't exist to avoid NaNs, but for exact partial matches, maybe 
      // we can do sub-token matching. Let's do exact BM25 for now.
      if (df === 0) continue;

      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));

      for (const doc of this.corpus) {
        const docId = doc.id;
        const tf = this.termFrequencies.get(docId)?.get(token) || 0;
        
        if (tf > 0) {
          const docLen = this.documentLengths.get(docId) || 0;
          const score = idf * (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * (docLen / this.averageDocumentLength)));
          scores.set(docId, (scores.get(docId) || 0) + score);
        }
      }
    }

    // Boost scores if the ID matches the prefix of the query,
    // which helps a lot since commodity codes are numbers usually typed first.
    const queryLower = query.toLowerCase();
    
    return this.corpus
      .map(doc => {
        let score = scores.get(doc.id) || 0;
        const idLower = doc.id.toLowerCase();
        
        // Custom boost if querying by HS Code
        if (idLower === queryLower) {
          score += 100;
        } else if (idLower.startsWith(queryLower)) {
          score += 50;
        } else if (queryLower.startsWith(idLower)) {
          score += 20;
        }
        
        // Exact text match boost
        if (doc.text.toLowerCase().includes(queryLower)) {
            score += 10;
        }

        return {
          id: doc.id,
          item: doc,
          score: score
        };
      })
      .filter(res => res.score > 0)
      .sort((a, b) => b.score - a.score);
  }
}
