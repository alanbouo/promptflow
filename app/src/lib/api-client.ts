/**
 * API Client for communicating with the PromptFlow backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Network error' };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const result = await this.request<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async register(email: string, password: string, name?: string) {
    const result = await this.request<{ user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async forgotPassword(email: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async getMe() {
    return this.request<any>('/api/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Templates endpoints
  async getTemplates() {
    return this.request<any[]>('/api/templates');
  }

  async getTemplate(id: string) {
    return this.request<any>(`/api/templates/${id}`);
  }

  async createTemplate(data: any) {
    return this.request<any>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: string, data: any) {
    return this.request<any>(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(id: string) {
    return this.request(`/api/templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Jobs endpoints
  async getJobs() {
    return this.request<any[]>('/api/jobs');
  }

  async getJob(id: string) {
    return this.request<any>(`/api/jobs/${id}`);
  }

  async createJob(data: any) {
    return this.request<any>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteJob(id: string) {
    return this.request(`/api/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getAccount() {
    return this.request<any>('/api/user/account');
  }

  async updateAccount(data: any) {
    return this.request<any>('/api/user/account', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/api/user/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async deleteAccount() {
    return this.request('/api/user/account', {
      method: 'DELETE',
    });
  }

  // Refine endpoints
  async generatePrompt(description: string, context?: string) {
    return this.request<{ prompt: string }>('/api/refine/generate', {
      method: 'POST',
      body: JSON.stringify({ description, context }),
    });
  }

  async refinePrompt(prompt: string, feedback: string) {
    return this.request<{ prompt: string }>('/api/refine/refine', {
      method: 'POST',
      body: JSON.stringify({ prompt, feedback }),
    });
  }

  async testPrompt(systemPrompt: string, userPrompt: string, testInput: string, settings?: any) {
    return this.request<{ output: string; tokenUsage: any }>('/api/refine/test', {
      method: 'POST',
      body: JSON.stringify({ systemPrompt, userPrompt, testInput, settings }),
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
