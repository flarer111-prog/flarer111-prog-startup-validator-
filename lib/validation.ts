export type ValidationInput = { idea: string; customer: string };

const demandWords = ['save','automate','urgent','expensive','slow','risk','scam','fraud','compliance','jobs','sales','money','waste','pain'];
const monetizationWords = ['pay','subscription','fee','commission','business','enterprise','save','revenue','cost'];

export function validateIdea({ idea, customer }: ValidationInput) {
  const text = `${idea} ${customer}`.toLowerCase();
  const demandHits = demandWords.filter(w => text.includes(w)).length;
  const moneyHits = monetizationWords.filter(w => text.includes(w)).length;
  const specificity = Math.min(25, Math.floor(idea.trim().length / 18));
  const customerScore = customer.trim().length >= 12 ? 20 : customer.trim().length >= 6 ? 12 : 5;
  const demandScore = Math.min(30, 10 + demandHits * 4);
  const monetizationScore = Math.min(25, 8 + moneyHits * 3);
  const problemScore = Math.min(20, 6 + (idea.length > 80 ? 10 : idea.length > 35 ? 6 : 2));
  const score = Math.min(100, specificity + customerScore + demandScore + monetizationScore + problemScore);
  const verdict = score >= 75 ? 'Strong initial signal' : score >= 55 ? 'Promising — needs evidence' : 'Weak initial signal';
  return { score, verdict, demand: demandScore >= 22 ? 'High' : demandScore >= 15 ? 'Medium' : 'Low', competition: 'Unknown', monetization: monetizationScore >= 18 ? 'Clearer' : 'Unclear', summary: 'This is a preliminary heuristic, not proof of market demand. The next engine layer will replace assumptions with external evidence.', nextSteps: ['Search for recent customer demand and complaints.', 'Map direct and indirect competitors and their pricing.', 'Look for willingness-to-pay signals and existing alternatives.'] };
}
