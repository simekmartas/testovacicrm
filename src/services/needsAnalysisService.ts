import { NeedsAnalysis } from '../types';

const STORAGE_KEY = 'crm_needs_analyses';

class NeedsAnalysisService {
  private getAll(): NeedsAnalysis[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private save(analyses: NeedsAnalysis[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
  }

  getByClientId(clientId: number): NeedsAnalysis | null {
    const analyses = this.getAll();
    return analyses.find(a => a.clientId === clientId) || null;
  }

  create(clientId: number): NeedsAnalysis {
    const analyses = this.getAll();
    
    // Zkontroluj, jestli už analýza neexistuje
    const existing = analyses.find(a => a.clientId === clientId);
    if (existing) {
      return existing;
    }

    const newAnalysis: NeedsAnalysis = {
      id: Date.now(),
      clientId,
      goals: {
        incomeProtection: { interested: false, notes: '' },
        housing: { interested: false, reason: '' },
        pension: { interested: false, currentSituation: '', desiredSolution: '' },
        children: { hasChildren: false, savingForEducation: false, notes: '' },
        savings: { interested: false, currentSavings: 0, reason: '' },
        assetProtection: { interested: false, assets: [], reason: '' },
        other: { taxOptimization: false, stateSupport: false, lifeGoals: '' }
      },
      existingProducts: [],
      cashFlow: {
        officialIncome: 0,
        additionalIncome: 0,
        employmentType: 'NEURCITA',
        expenses: 0,
        loans: 0,
        overdraft: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedSections: [],
      isComplete: false
    };

    analyses.push(newAnalysis);
    this.save(analyses);
    return newAnalysis;
  }

  update(id: number, data: Partial<NeedsAnalysis>): NeedsAnalysis | null {
    const analyses = this.getAll();
    const index = analyses.findIndex(a => a.id === id);
    
    if (index === -1) return null;

    analyses[index] = {
      ...analyses[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    // Zkontroluj dokončení
    analyses[index].isComplete = this.checkCompletion(analyses[index]);

    this.save(analyses);
    return analyses[index];
  }

  updateSection(id: number, section: string, data: any): NeedsAnalysis | null {
    const analyses = this.getAll();
    const index = analyses.findIndex(a => a.id === id);
    
    if (index === -1) return null;

    // Aktualizuj konkrétní sekci
    (analyses[index] as any)[section] = data;
    
    // Přidej sekci do dokončených
    if (!analyses[index].completedSections.includes(section)) {
      analyses[index].completedSections.push(section);
    }

    analyses[index].updatedAt = new Date().toISOString();
    analyses[index].isComplete = this.checkCompletion(analyses[index]);

    this.save(analyses);
    return analyses[index];
  }

  private checkCompletion(analysis: NeedsAnalysis): boolean {
    const requiredSections = ['goals', 'cashFlow'];
    return requiredSections.every(section => 
      analysis.completedSections.includes(section)
    );
  }

  delete(id: number): boolean {
    const analyses = this.getAll();
    const filtered = analyses.filter(a => a.id !== id);
    
    if (filtered.length === analyses.length) return false;
    
    this.save(filtered);
    return true;
  }

  getCompletionPercentage(analysis: NeedsAnalysis): number {
    const totalSections = 7; // goals, existingProducts, cashFlow, insurance, housing, investment, other
    const completed = analysis.completedSections.length;
    return Math.round((completed / totalSections) * 100);
  }
}

export const needsAnalysisService = new NeedsAnalysisService(); 