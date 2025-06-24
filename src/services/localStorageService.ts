import { User, Client, Meeting, Task, WorkflowStage, UserRole, TaskPriority } from '../types';

// Klíče pro localStorage
const STORAGE_KEYS = {
  USERS: 'crm_users',
  CLIENTS: 'crm_clients',
  MEETINGS: 'crm_meetings',
  TASKS: 'crm_tasks',
  CURRENT_USER: 'crm_current_user',
};

// Pomocné funkce pro práci s localStorage
const getFromStorage = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

// Inicializace výchozích dat
export const initializeDefaultData = () => {
  // Zkontroluj, jestli už data existují
  const users = getFromStorage<User>(STORAGE_KEYS.USERS);
  
  if (users.length === 0) {
    // Vytvoř výchozí uživatele
    const defaultUsers: User[] = [
      {
        id: 1,
        username: 'vedouci',
        firstName: 'Jan',
        lastName: 'Novák',
        email: 'vedouci@crm.cz',
        phone: '+420 123 456 789',
        role: UserRole.VEDOUCI,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        username: 'poradce',
        firstName: 'Petr',
        lastName: 'Svoboda',
        email: 'poradce@crm.cz',
        phone: '+420 987 654 321',
        role: UserRole.PORADCE,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3,
        username: 'asistent',
        firstName: 'Marie',
        lastName: 'Dvořáková',
        email: 'asistent@crm.cz',
        phone: '+420 555 666 777',
        role: UserRole.ASISTENT,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    
    saveToStorage(STORAGE_KEYS.USERS, defaultUsers);
    
    // Vytvoř ukázkové klienty
    const sampleClients: Client[] = [
      {
        id: 1,
        firstName: 'Tomáš',
        lastName: 'Procházka',
        email: 'tomas.prochazka@email.cz',
        phone: '+420 111 222 333',
        dateOfBirth: '1985-05-15',
        address: 'Hlavní 123',
        city: 'Praha',
        postalCode: '11000',
        notes: 'Zájem o investiční produkty',
        workflowStage: WorkflowStage.ANALYZA_POTREB,
        advisorId: 2,
        advisorName: 'Petr Svoboda',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasNeedsAnalysis: false,
        documentsCount: 0,
        meetingsCount: 1,
      },
      {
        id: 2,
        firstName: 'Eva',
        lastName: 'Nováková',
        email: 'eva.novakova@email.cz',
        phone: '+420 444 555 666',
        dateOfBirth: '1990-08-20',
        address: 'Vedlejší 456',
        city: 'Brno',
        postalCode: '60200',
        notes: 'Řeší životní pojištění',
        workflowStage: WorkflowStage.PRODEJNI_SCHUZKA,
        advisorId: 2,
        advisorName: 'Petr Svoboda',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasNeedsAnalysis: true,
        documentsCount: 2,
        meetingsCount: 3,
      },
    ];
    
    saveToStorage(STORAGE_KEYS.CLIENTS, sampleClients);
  }
};

// User service
export const userService = {
  login: (username: string, password: string): User | null => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const user = users.find(u => u.username === username);
    
    // Pro demo účely přijmeme jakékoliv heslo
    if (user && password === 'heslo123') {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    }
    
    return null;
  },
  
  logout: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
  
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  },
  
  getAllUsers: (): User[] => {
    return getFromStorage<User>(STORAGE_KEYS.USERS);
  },
};

// Client service
export const clientService = {
  getAll: (): Client[] => {
    const currentUser = userService.getCurrentUser();
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    
    // Pokud je uživatel vedoucí, vrať všechny klienty
    if (currentUser?.role === UserRole.VEDOUCI) {
      return clients;
    }
    
    // Jinak vrať jen klienty přiřazené danému poradci
    return clients.filter(c => c.advisorId === currentUser?.id);
  },
  
  getById: (id: number): Client | null => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    return clients.find(c => c.id === id) || null;
  },
  
  create: (clientData: Partial<Client>): Client => {
    const currentUser = userService.getCurrentUser();
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    
    const newClient: Client = {
      id: generateId(),
      firstName: clientData.firstName || '',
      lastName: clientData.lastName || '',
      email: clientData.email || '',
      phone: clientData.phone || '',
      dateOfBirth: clientData.dateOfBirth,
      address: clientData.address || '',
      city: clientData.city || '',
      postalCode: clientData.postalCode || '',
      notes: clientData.notes || '',
      workflowStage: clientData.workflowStage || WorkflowStage.NAVOLANI,
      advisorId: currentUser?.id || 0,
      advisorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hasNeedsAnalysis: false,
      documentsCount: 0,
      meetingsCount: 0,
    };
    
    clients.push(newClient);
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
    
    return newClient;
  },
  
  update: (id: number, updates: Partial<Client>): Client | null => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    const index = clients.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    clients[index] = {
      ...clients[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
    return clients[index];
  },
  
  updateWorkflowStage: (id: number, stage: WorkflowStage): Client | null => {
    return clientService.update(id, { workflowStage: stage });
  },
  
  delete: (id: number): boolean => {
    const clients = getFromStorage<Client>(STORAGE_KEYS.CLIENTS);
    const filtered = clients.filter(c => c.id !== id);
    
    if (filtered.length === clients.length) return false;
    
    saveToStorage(STORAGE_KEYS.CLIENTS, filtered);
    return true;
  },
  
  search: (query: string): Client[] => {
    const allClients = clientService.getAll();
    const lowerQuery = query.toLowerCase();
    
    return allClients.filter(client =>
      client.firstName.toLowerCase().includes(lowerQuery) ||
      client.lastName.toLowerCase().includes(lowerQuery) ||
      client.email.toLowerCase().includes(lowerQuery) ||
      (client.phone && client.phone.toLowerCase().includes(lowerQuery))
    );
  },
};

// Meeting service
export const meetingService = {
  getAll: (): Meeting[] => {
    const currentUser = userService.getCurrentUser();
    const meetings = getFromStorage<Meeting>(STORAGE_KEYS.MEETINGS);
    
    if (currentUser?.role === UserRole.VEDOUCI) {
      return meetings;
    }
    
    return meetings.filter(m => m.userId === currentUser?.id);
  },
  
  create: (meetingData: Partial<Meeting>): Meeting => {
    const currentUser = userService.getCurrentUser();
    const meetings = getFromStorage<Meeting>(STORAGE_KEYS.MEETINGS);
    
    const newMeeting: Meeting = {
      id: generateId(),
      title: meetingData.title || '',
      description: meetingData.description,
      startTime: meetingData.startTime || new Date().toISOString(),
      endTime: meetingData.endTime || new Date().toISOString(),
      location: meetingData.location,
      meetingType: meetingData.meetingType,
      notes: meetingData.notes,
      userId: currentUser?.id || 0,
      clientId: meetingData.clientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    meetings.push(newMeeting);
    saveToStorage(STORAGE_KEYS.MEETINGS, meetings);
    
    return newMeeting;
  },
  
  update: (id: number, updates: Partial<Meeting>): Meeting | null => {
    const meetings = getFromStorage<Meeting>(STORAGE_KEYS.MEETINGS);
    const index = meetings.findIndex(m => m.id === id);
    
    if (index === -1) return null;
    
    meetings[index] = {
      ...meetings[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveToStorage(STORAGE_KEYS.MEETINGS, meetings);
    return meetings[index];
  },
  
  delete: (id: number): boolean => {
    const meetings = getFromStorage<Meeting>(STORAGE_KEYS.MEETINGS);
    const filtered = meetings.filter(m => m.id !== id);
    
    if (filtered.length === meetings.length) return false;
    
    saveToStorage(STORAGE_KEYS.MEETINGS, filtered);
    return true;
  },
};

// Task service
export const taskService = {
  getAll: (): Task[] => {
    const currentUser = userService.getCurrentUser();
    const tasks = getFromStorage<Task>(STORAGE_KEYS.TASKS);
    
    if (currentUser?.role === UserRole.VEDOUCI) {
      return tasks;
    }
    
    return tasks.filter(t => t.assignedToId === currentUser?.id || t.createdById === currentUser?.id);
  },
  
  create: (taskData: Partial<Task>): Task => {
    const currentUser = userService.getCurrentUser();
    const tasks = getFromStorage<Task>(STORAGE_KEYS.TASKS);
    
    const newTask: Task = {
      id: generateId(),
      title: taskData.title || '',
      description: taskData.description,
      priority: taskData.priority || TaskPriority.MEDIUM,
      dueDate: taskData.dueDate,
      completed: false,
      createdById: currentUser?.id || 0,
      assignedToId: taskData.assignedToId || currentUser?.id || 0,
      clientId: taskData.clientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    tasks.push(newTask);
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    
    return newTask;
  },
  
  update: (id: number, updates: Partial<Task>): Task | null => {
    const tasks = getFromStorage<Task>(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    return tasks[index];
  },
  
  complete: (id: number): Task | null => {
    return taskService.update(id, {
      completed: true,
      completedAt: new Date().toISOString(),
    });
  },
  
  delete: (id: number): boolean => {
    const tasks = getFromStorage<Task>(STORAGE_KEYS.TASKS);
    const filtered = tasks.filter(t => t.id !== id);
    
    if (filtered.length === tasks.length) return false;
    
    saveToStorage(STORAGE_KEYS.TASKS, filtered);
    return true;
  },
}; 