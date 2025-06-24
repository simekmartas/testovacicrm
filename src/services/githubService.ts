import { Client, Meeting, Task } from '../types';
import { config } from '../config/environment';

// Base64 encoding/decoding
const encodeBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)));
};

const decodeBase64 = (str: string): string => {
  return decodeURIComponent(escape(atob(str)));
};

// GitHub API helper funkce
const githubRequest = async (
  path: string,
  method: 'GET' | 'PUT' | 'DELETE' = 'GET',
  body?: any
) => {
  const token = config.github.token;
  
  if (!token) {
    throw new Error('GitHub token není nastaven');
  }
  
  const response = await fetch(
    `https://api.github.com/repos/${config.github.owner}/${config.github.repo}/contents/${path}`,
    {
      method,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.status === 404 ? null : response.json();
};

// Získat SHA existujícího souboru (potřebné pro update)
const getFileSha = async (path: string): Promise<string | null> => {
  try {
    const data = await githubRequest(path);
    return data?.sha || null;
  } catch {
    return null;
  }
};

// Uložit JSON soubor do GitHub
const saveJsonFile = async (path: string, data: any, message: string) => {
  const content = encodeBase64(JSON.stringify(data, null, 2));
  const sha = await getFileSha(path);
  
  const body: any = {
    message,
    content,
    branch: config.github.branch,
  };
  
  if (sha) {
    body.sha = sha;
  }
  
  return githubRequest(path, 'PUT', body);
};

// Načíst JSON soubor z GitHub
const loadJsonFile = async (path: string): Promise<any | null> => {
  try {
    const data = await githubRequest(path);
    if (!data) return null;
    
    const content = decodeBase64(data.content);
    return JSON.parse(content);
  } catch {
    return null;
  }
};

// Získat seznam souborů v adresáři
const listFiles = async (path: string): Promise<string[]> => {
  try {
    const data = await githubRequest(path);
    if (!Array.isArray(data)) return [];
    
    return data
      .filter((item: any) => item.type === 'file' && item.name.endsWith('.json'))
      .map((item: any) => item.name);
  } catch {
    return [];
  }
};

// Export služeb pro jednotlivé entity
export const githubClientService = {
  async getAll(): Promise<Client[]> {
    const files = await listFiles('clients');
    const clients: Client[] = [];
    
    for (const file of files) {
      const data = await loadJsonFile(`clients/${file}`);
      if (data) clients.push(data);
    }
    
    return clients;
  },
  
  async save(client: Client): Promise<void> {
    await saveJsonFile(
      `clients/client-${client.id}.json`,
      client,
      `Update client: ${client.firstName} ${client.lastName}`
    );
  },
  
  async delete(id: number): Promise<void> {
    const sha = await getFileSha(`clients/client-${id}.json`);
    if (sha) {
      await githubRequest(`clients/client-${id}.json`, 'DELETE', {
        message: `Delete client ${id}`,
        sha,
        branch: config.github.branch,
      });
    }
  },
};

export const githubMeetingService = {
  async getAll(): Promise<Meeting[]> {
    const files = await listFiles('meetings');
    const meetings: Meeting[] = [];
    
    for (const file of files) {
      const data = await loadJsonFile(`meetings/${file}`);
      if (data) meetings.push(data);
    }
    
    return meetings;
  },
  
  async save(meeting: Meeting): Promise<void> {
    await saveJsonFile(
      `meetings/meeting-${meeting.id}.json`,
      meeting,
      `Update meeting: ${meeting.title}`
    );
  },
  
  async delete(id: number): Promise<void> {
    const sha = await getFileSha(`meetings/meeting-${id}.json`);
    if (sha) {
      await githubRequest(`meetings/meeting-${id}.json`, 'DELETE', {
        message: `Delete meeting ${id}`,
        sha,
        branch: config.github.branch,
      });
    }
  },
};

export const githubTaskService = {
  async getAll(): Promise<Task[]> {
    const files = await listFiles('tasks');
    const tasks: Task[] = [];
    
    for (const file of files) {
      const data = await loadJsonFile(`tasks/${file}`);
      if (data) tasks.push(data);
    }
    
    return tasks;
  },
  
  async save(task: Task): Promise<void> {
    await saveJsonFile(
      `tasks/task-${task.id}.json`,
      task,
      `Update task: ${task.title}`
    );
  },
  
  async delete(id: number): Promise<void> {
    const sha = await getFileSha(`tasks/task-${id}.json`);
    if (sha) {
      await githubRequest(`tasks/task-${id}.json`, 'DELETE', {
        message: `Delete task ${id}`,
        sha,
        branch: config.github.branch,
      });
    }
  },
};

// Inicializace struktury repozitáře
export const initializeRepository = async () => {
  if (!config.github.token) return;
  
  // Vytvoř základní adresáře
  const dirs = ['clients', 'meetings', 'tasks', 'documents', 'milestones'];
  
  for (const dir of dirs) {
    try {
      // Zkus vytvořit README v každém adresáři
      await saveJsonFile(
        `${dir}/README.md`,
        `# ${dir.charAt(0).toUpperCase() + dir.slice(1)} Data\n\nThis directory contains ${dir} data.`,
        `Initialize ${dir} directory`
      );
    } catch {
      // Adresář už existuje
    }
  }
}; 