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

// Needs Analysis interface
export interface NeedsAnalysis {
  id: number;
  clientId: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  savings?: number;
  debts?: number;
  maritalStatus?: string;
  numberOfChildren?: number;
  dependentPersons?: number;
  shortTermGoals?: string;
  longTermGoals?: string;
  hasLifeInsurance: boolean;
  hasHealthInsurance: boolean;
  hasPropertyInsurance: boolean;
  hasLiabilityInsurance: boolean;
  investmentExperience?: string;
  riskTolerance?: string;
  hasPensionSavings: boolean;
  pensionMonthlyContribution?: number;
  additionalNotes?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
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