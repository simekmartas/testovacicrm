// Konfigurace environment variables
export const config = {
  // GitHub API
  github: {
    token: (window as any).ENV?.GITHUB_TOKEN || '',
    owner: 'simekmartas',
    repo: 'crmdata',
    branch: 'main',
  },
  
  // Lokální storage jako fallback
  useLocalStorage: !(window as any).ENV?.GITHUB_TOKEN,
  
  // Google Calendar (pro budoucí použití)
  google: {
    clientId: (window as any).ENV?.GOOGLE_CLIENT_ID || '',
    apiKey: (window as any).ENV?.GOOGLE_API_KEY || '',
  },
};

// Helper pro kontrolu, zda máme GitHub token
export const hasGithubAccess = () => {
  return !!config.github.token;
}; 