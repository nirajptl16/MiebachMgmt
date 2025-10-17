import { apiClient } from "./client";

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    token: string;
    user:{
        id: string;
        name: string;
        email: string;
        role: 'MANAGER' | 'CONTRIBUTOR';
    };
}

interface Project {
  id: string;
  name: string;
  clientName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface ProjectStaffing {
  id: string;
  userId: string;
  roleName: string;
  hourlyRate: number;
  forecastHours: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ProjectPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface ProjectDetail extends Project {
  staffing: ProjectStaffing[];
  phases: ProjectPhase[];
}

interface CreateProjectRequest {
  name: string;
  clientName: string;
  startDate: string;
  endDate: string;
}

interface AddStaffingRequest {
  userId: string;
  roleName: string;
  hourlyRate: number;
  forecastHours: number;
}

interface AddPhaseRequest {
  name: string;
  startDate: string;
  endDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'MANAGER' | 'CONTRIBUTOR';
}
export interface Task {
  id: string;
  title: string;
  description: string | null;
  budget: number;
  dueDate: string;
  status: string;
  startDate: string;
  endDate: string;
  phaseId: string;
  phase: {
    id: string;
    name: string;
  };
  assignments: TaskAssignment[];
}

export interface TaskAssignment {
  id: string;
  userId: string;
  hourlyRate: number;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface CreateTaskRequest {
  title: string;
  description?: string;
  budget: number;
  startDate: string;
  endDate: string;
  dueDate: string;
  phaseId: string;
}

interface AssignTaskRequest {
  userId: string;
  hourlyRate: number;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  date: string;
  hours: number;
  isBillable: boolean;
  task?: {
    id: string;
    title: string;
    phase: {
      id: string;
      name: string;
      project: {
        id: string;
        name: string;
      };
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateTimeEntryRequest {
  taskId: string;
  date: string;
  hours: number;
  isBillable: boolean;
}

export interface TaskBudget {
  taskId: string;
  taskTitle: string;
  budget: number;
  consumed: number;
  remaining: number;
  percentUsed: number;
}


export interface UtilizationEntry {
  userId: string;
  userName: string;
  periodStart: string;
  periodEnd: string;
  staffedHours: number;
  actualLoggedHours: number;
  utilizationPercent: number;
  projectId?: string;
  projectName?: string;
}

//Login API call 
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
};

//Get current user details
export const getCurrentUser = async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
};

export const getAllUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/auth/users');
  return response.data;
};

//Logout user
export const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login'; //redirect to login page
};

export const getAllProjects = async (): Promise<Project[]> => {
  const response = await apiClient.get<Project[]>('/projects');
  return response.data;
};

export const getProject = async (projectId: string): Promise<ProjectDetail> => {
  const response = await apiClient.get<ProjectDetail>(`/projects/${projectId}`);
  return response.data;
};

export const createProject = async (data: CreateProjectRequest): Promise<Project> => {
  const response = await apiClient.post<Project>('/projects', data);
  return response.data;
};

export const addStaffing = async (projectId: string, data: AddStaffingRequest): Promise<ProjectStaffing> => {
  const response = await apiClient.post<ProjectStaffing>(`/projects/${projectId}/staffing`, data);
  return response.data;
};

export const addPhase = async (projectId: string, data: AddPhaseRequest): Promise<ProjectPhase> => {
  const response = await apiClient.post<ProjectPhase>(`/projects/${projectId}/phases`, data);
  return response.data;
};

// ==================== TASK API ====================

export const getTasksByPhase = async (phaseId: string): Promise<Task[]> => {
  const response = await apiClient.get<Task[]>(`/tasks/phase/${phaseId}`);
  return response.data;
};

export const createTask = async (data: CreateTaskRequest): Promise<Task> => {
  console.log('Creating task with data:', data);
  
  const response = await apiClient.post<Task>('/tasks', {
    title: data.title,
    description: data.description || '',
    budget: Number(data.budget),
    startDate: data.startDate,
    endDate: data.endDate,
    dueDate: data.dueDate,
    phaseId: data.phaseId,
  });
  
  return response.data;
};

export const assignTask = async (taskId: string, data: AssignTaskRequest): Promise<TaskAssignment> => {
  const response = await apiClient.post<TaskAssignment>(`/tasks/${taskId}/assign`, data);
  return response.data;
};

export const getMyTasks = async (): Promise<Task[]> => {
  const response = await apiClient.get<Task[]>('/tasks/my-tasks');
  return response.data;
};

// ==================== TIME ENTRY API ====================

export const createTimeEntry = async (data: CreateTimeEntryRequest): Promise<TimeEntry> => {
  const response = await apiClient.post<TimeEntry>('/time-entries', data);
  return response.data;
};

export const getMyTimeEntries = async (): Promise<TimeEntry[]> => {
  const response = await apiClient.get<TimeEntry[]>('/time-entries/my-entries');
  return response.data;
};

export const getTaskTimeEntries = async (taskId: string): Promise<TimeEntry[]> => {
  const response = await apiClient.get<TimeEntry[]>(`/time-entries/task/${taskId}`);
  return response.data;
};

export const updateTimeEntry = async (
  entryId: string,
  data: Partial<CreateTimeEntryRequest>
): Promise<TimeEntry> => {
  const response = await apiClient.put<TimeEntry>(`/time-entries/${entryId}`, data);
  return response.data;
};

export const deleteTimeEntry = async (entryId: string): Promise<void> => {
  await apiClient.delete(`/time-entries/${entryId}`);
};

export const getTaskBudget = async (taskId: string): Promise<TaskBudget> => {
  const response = await apiClient.get<TaskBudget>(`/time-entries/task/${taskId}/budget`);
  return response.data;
};

export const getProjectBudget = async (projectId: string) => {
  const response = await apiClient.get(`/projects/${projectId}/budget`);
  return response.data;
};

export const getPhaseBudget = async (phaseId: string) => {
  const response = await apiClient.get(`/time-entries/phase/${phaseId}/budget`);
  return response.data;
};

export const getProjectUtilization = async (
  projectId: string,
  period: string // e.g., '2025-10-01' for week/month start
): Promise<UtilizationEntry[]> => {
  const response = await apiClient.get<UtilizationEntry[]>(
    `/projects/${projectId}/utilization?period=${period}`
  );
  return response.data;
};

// Get utilization by user (across projects, per period)
export const getUserUtilization = async (
  userId: string,
  period: string
): Promise<UtilizationEntry[]> => {
  const response = await apiClient.get<UtilizationEntry[]>(
    `/auth/users/${userId}/utilization?period=${period}`
  );
  return response.data;
};