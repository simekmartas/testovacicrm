// Uživatelské role
export enum UserRole {
  VEDOUCI = 'VEDOUCI',
  PORADCE = 'PORADCE',
  ASISTENT = 'ASISTENT'
}

// Workflow fáze
export enum WorkflowStage {
  NAVOLANI = 'NAVOLANI',
  ANALYZA_POTREB = 'ANALYZA_POTREB',
  ZPRACOVANI = 'ZPRACOVANI',
  PRODEJNI_SCHUZKA = 'PRODEJNI_SCHUZKA',
  PODPIS = 'PODPIS',
  SERVIS = 'SERVIS'
}

// Priority úkolů
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Potenciál klienta
export interface ClientPotential {
  id: number;
  clientId: number;
  lifeInsurance: {
    interested: boolean;
    expectedCommission: number;
    notes?: string;
  };
  investments: {
    interested: boolean;
    expectedCommission: number;
    notes?: string;
  };
  mortgage: {
    interested: boolean;
    expectedCommission: number;
    notes?: string;
  };
  nonLifeInsurance: {
    auto: {
      interested: boolean;
      expectedCommission: number;
      notes?: string;
    };
    property: {
      interested: boolean;
      expectedCommission: number;
      notes?: string;
    };
    household: {
      interested: boolean;
      expectedCommission: number;
      notes?: string;
    };
    liability: {
      interested: boolean;
      expectedCommission: number;
      notes?: string;
    };
  };
  totalExpectedCommission: number;
  priority: 'NIZKY' | 'STREDNI' | 'VYSOKY';
  createdAt: string;
  updatedAt: string;
}

// User interface
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
}

// Client interface
export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
  workflowStage: WorkflowStage;
  advisorId: number;
  advisorName: string;
  createdAt: string;
  updatedAt: string;
  hasNeedsAnalysis: boolean;
  documentsCount: number;
  meetingsCount: number;
  fullName?: string;
  potential?: ClientPotential;
}

// Meeting interface
export interface Meeting {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingType?: string;
  notes?: string;
  userId: number;
  clientId?: number;
  googleEventId?: string;
  appleEventId?: string;
  createdAt: string;
  updatedAt: string;
}

// Task interface
export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  createdById: number;
  assignedToId: number;
  clientId?: number;
  createdAt: string;
  updatedAt: string;
}

// Document interface
export interface Document {
  id: number;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  filePath: string;
  description?: string;
  clientId: number;
  uploadedById: number;
  uploadedAt: string;
}

// Life Milestone interface
export interface LifeMilestone {
  id: number;
  type: string;
  title: string;
  description?: string;
  eventDate: string;
  reminderDate?: string;
  reminderSent: boolean;
  clientId: number;
  createdAt: string;
}

// Auth interfaces
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  user: User;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// Nové typy pro analýzu potřeb
export interface NeedsAnalysisGoals {
  incomeProtection: {
    interested: boolean;
    notes: string;
  };
  housing: {
    interested: boolean;
    reason: string;
  };
  pension: {
    interested: boolean;
    currentSituation: string;
    desiredSolution: string;
  };
  children: {
    hasChildren: boolean;
    savingForEducation: boolean;
    amount?: number;
    notes: string;
  };
  savings: {
    interested: boolean;
    currentSavings: number;
    reason: string;
  };
  assetProtection: {
    interested: boolean;
    assets: string[];
    reason: string;
  };
  other: {
    taxOptimization: boolean;
    stateSupport: boolean;
    lifeGoals: string;
  };
}

export interface ExistingProduct {
  id: string;
  type: string;
  company: string;
  reason: string;
  usage: string;
  pros: string;
  cons: string;
  advisor: string;
  hasContract: boolean;
}

export interface CashFlow {
  officialIncome: number;
  additionalIncome: number;
  employmentType: 'URCITA' | 'NEURCITA' | 'OSVC';
  employerContribution?: number;
  expenses: number;
  loans: number;
  overdraft: number;
}

export interface InsuranceDetails {
  risks: string[];
  healthStatus: {
    isHealthy: boolean;
    allergies: string;
    medications: string;
    procedures: string;
    diabetes: boolean;
    other: string;
  };
  physicalInfo: {
    height: number;
    weight: number;
    smoker: boolean;
  };
  sports: string[];
  budget: number;
  includedPersons: string[];
}

export interface HousingDetails {
  goal: string;
  amount: number;
  timeline: string;
  currentSavings: number;
  monthlyPayment: number;
  coOwner: boolean;
  collateral: string;
}

export interface InvestmentDetails {
  targetAmount: number;
  monthlyInvestment: number;
  timeHorizon: number;
  liquidityImportant: boolean;
  preferredInvestments: string[];
  riskTolerance: 'KONZERVATIVNI' | 'VYVAZENY' | 'DYNAMICKY';
}

export interface NeedsAnalysis {
  id: number;
  clientId: number;
  goals: NeedsAnalysisGoals;
  existingProducts: ExistingProduct[];
  cashFlow: CashFlow;
  insuranceDetails?: InsuranceDetails;
  housingDetails?: HousingDetails;
  investmentDetails?: InvestmentDetails;
  createdAt: string;
  updatedAt: string;
  completedSections: string[];
  isComplete: boolean;
} 