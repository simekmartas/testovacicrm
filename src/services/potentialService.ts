import { ClientPotential } from '../types';

const STORAGE_KEY = 'crm_client_potentials';

class PotentialService {
  private getAll(): ClientPotential[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private save(potentials: ClientPotential[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(potentials));
  }

  getByClientId(clientId: number): ClientPotential | null {
    const potentials = this.getAll();
    return potentials.find(p => p.clientId === clientId) || null;
  }

  create(clientId: number): ClientPotential {
    const potentials = this.getAll();
    
    // Zkontroluj, jestli už potenciál neexistuje
    const existing = potentials.find(p => p.clientId === clientId);
    if (existing) {
      return existing;
    }

    const newPotential: ClientPotential = {
      id: Date.now(),
      clientId,
      lifeInsurance: {
        interested: false,
        expectedCommission: 0
      },
      investments: {
        interested: false,
        expectedCommission: 0
      },
      mortgage: {
        interested: false,
        expectedCommission: 0
      },
      nonLifeInsurance: {
        auto: {
          interested: false,
          expectedCommission: 0
        },
        property: {
          interested: false,
          expectedCommission: 0
        },
        household: {
          interested: false,
          expectedCommission: 0
        },
        liability: {
          interested: false,
          expectedCommission: 0
        }
      },
      totalExpectedCommission: 0,
      priority: 'STREDNI',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    potentials.push(newPotential);
    this.save(potentials);
    return newPotential;
  }

  update(id: number, data: Partial<ClientPotential>): ClientPotential | null {
    const potentials = this.getAll();
    const index = potentials.findIndex(p => p.id === id);
    
    if (index === -1) return null;

    potentials[index] = {
      ...potentials[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    // Přepočítej celkovou provizi
    potentials[index].totalExpectedCommission = this.calculateTotalCommission(potentials[index]);
    
    // Automaticky nastav prioritu podle celkové provize
    potentials[index].priority = this.calculatePriority(potentials[index].totalExpectedCommission);

    this.save(potentials);
    return potentials[index];
  }

  private calculateTotalCommission(potential: ClientPotential): number {
    let total = 0;
    
    if (potential.lifeInsurance.interested) {
      total += potential.lifeInsurance.expectedCommission;
    }
    if (potential.investments.interested) {
      total += potential.investments.expectedCommission;
    }
    if (potential.mortgage.interested) {
      total += potential.mortgage.expectedCommission;
    }
    
    const nonLife = potential.nonLifeInsurance;
    if (nonLife.auto.interested) total += nonLife.auto.expectedCommission;
    if (nonLife.property.interested) total += nonLife.property.expectedCommission;
    if (nonLife.household.interested) total += nonLife.household.expectedCommission;
    if (nonLife.liability.interested) total += nonLife.liability.expectedCommission;
    
    return total;
  }

  private calculatePriority(totalCommission: number): 'NIZKY' | 'STREDNI' | 'VYSOKY' {
    if (totalCommission >= 50000) return 'VYSOKY';
    if (totalCommission >= 20000) return 'STREDNI';
    return 'NIZKY';
  }

  delete(id: number): boolean {
    const potentials = this.getAll();
    const filtered = potentials.filter(p => p.id !== id);
    
    if (filtered.length === potentials.length) return false;
    
    this.save(filtered);
    return true;
  }

  getByPriority(priority: 'NIZKY' | 'STREDNI' | 'VYSOKY'): ClientPotential[] {
    return this.getAll().filter(p => p.priority === priority);
  }

  getTopPotentials(limit: number = 10): ClientPotential[] {
    return this.getAll()
      .sort((a, b) => b.totalExpectedCommission - a.totalExpectedCommission)
      .slice(0, limit);
  }
}

export const potentialService = new PotentialService(); 