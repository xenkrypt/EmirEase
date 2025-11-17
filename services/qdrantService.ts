export interface KnowledgeBaseChunk {
  id: string;
  topic: string;
  keywords: string[];
  content: string;
}

const KNOWLEDGE_BASE: KnowledgeBaseChunk[] = [
  // EID Renewal
  { id: 'eid-1', topic: 'Emirates ID Renewal Process', keywords: ['emirates', 'id', 'renewal', 'expired', 'process', 'steps'], content: 'To renew an expired Emirates ID, you must visit an ICA service center or use the online portal. You will need your expired ID, passport, and a recent photograph.' },
  { id: 'eid-2', topic: 'Emirates ID Renewal Fees', keywords: ['emirates', 'id', 'renewal', 'fees', 'cost', 'price'], content: 'The renewal fee for an Emirates ID is AED 170 for a 2-year validity. Additional charges may apply for typing centers.' },
  { id: 'eid-3', topic: 'Emirates ID Late Renewal Fines', keywords: ['emirates', 'id', 'renewal', 'fines', 'late', 'penalty'], content: 'A fine of AED 20 per day is applied for late renewal of an Emirates ID, up to a maximum of AED 1,000. This begins one month after the expiry date.' },
  
  // Golden Visa
  { id: 'gv-1', topic: 'Golden Visa Investor Requirements', keywords: ['golden', 'visa', 'application', 'requirements', 'investor'], content: 'Investors applying for a Golden Visa need to show proof of a public investment of at least AED 2 million.' },
  { id: 'gv-2', topic: 'Golden Visa Benefits', keywords: ['golden', 'visa', 'benefits', 'advantages', 'perks'], content: 'Benefits of the Golden Visa include long-term residency (5 or 10 years) without a national sponsor and the ability to sponsor family members, including spouses and children regardless of their age.' },
  { id: 'gv-3', topic: 'Golden Visa for Professionals', keywords: ['golden', 'visa', 'professionals', 'doctor', 'engineer'], content: 'Specialized professionals like doctors, scientists, and engineers can apply for the Golden Visa if they meet certain criteria regarding their qualifications and field of work.' },

  // Traffic Fines
  { id: 'tf-1', topic: 'How to Settle Traffic Fines', keywords: ['traffic', 'fines', 'payment', 'settle', 'how', 'pay'], content: 'Traffic fines can be paid through the Dubai Police app, website, or at RTA service centers. A valid vehicle registration (mulkiya) is required.' },
  { id: 'tf-2', topic: 'Traffic Fine Discounts', keywords: ['traffic', 'fines', 'discount', 'reduction', 'offer'], content: 'Discounts on traffic fines are sometimes offered during national holidays or as part of special initiatives. Check the official Dubai Police channels for announcements.' },
  { id: 'tf-3', topic: 'Contesting a Traffic Fine', keywords: ['traffic', 'fines', 'contest', 'dispute', 'appeal'], content: 'If you believe a fine was issued in error, you can contest it online via the Dubai Police website within 30 days of the violation date.' },
];


export const searchKnowledgeBase = async (query: string, topicFilter: string): Promise<KnowledgeBaseChunk[]> => {
  return new Promise(resolve => {
    setTimeout(() => { // Simulate network latency
      if (!query.trim()) {
        resolve([]);
        return;
      }
      
      const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));

      const topicFilteredChunks = KNOWLEDGE_BASE.filter(chunk => chunk.topic.toLowerCase().includes(topicFilter.toLowerCase()));
      
      const scoredChunks = topicFilteredChunks.map(chunk => {
        let score = 0;
        chunk.keywords.forEach(kw => {
          if(queryWords.has(kw)) {
            score++;
          }
        });
        return { chunk, score };
      });
      
      const relevantChunks = scoredChunks
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.chunk);

      resolve(relevantChunks.slice(0, 2)); // Return top 2 matches
    }, 500);
  });
};
