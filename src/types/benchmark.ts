export interface AppealPoint {
  type: string;
  summary: string;
  strength: number;
}

export interface CompetitorAnalysis {
  url: string;
  name: string;
  appealPoints: AppealPoint[];
  keywords: string[];
  priceRange?: string;
}

export interface BenchmarkResult {
  competitors: CompetitorAnalysis[];
  comparison: {
    myStrengths: string[];
    competitorStrengths: string[];
    opportunities: string[];
    suggestedAppealPoints: { type: string; description: string }[];
  };
}
