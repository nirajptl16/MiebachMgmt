export interface User {
  id: string;
  email: string;
  name: string;
  role: 'MANAGER' | 'CONTRIBUTOR';
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  startDate: string;
  endDate: string;
  staffing?: ProjectStaffing[];
  phases?: Phase[];
}

export interface ProjectStaffing {
  id: string;
  projectId: string;
  userId: string;
  roleName: string;
  hourlyRate: number;
  forecastHours: number;
  user?: User;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  phaseId: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  startDate: string;
  endDate: string;
  dueDate: string;
  budget: number;
  phase?: Phase;
  assignments?: TaskAssignment[];
  timeEntries?: TimeEntry[];
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  hourlyRate: number;
  user?: User;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  workDate: string;
  hours: number;
  isBillable: boolean;
}

export interface BudgetData {
  projectId: string;
  name: string;
  forecastBudget: number;
  actualCost: number;
  remaining: number;
  phases: PhaseBudget[];
}

export interface PhaseBudget {
  phaseId: string;
  name: string;
  budget: number;
  actualCost: number;
  remaining: number;
  tasks: TaskBudget[];
}

export interface TaskBudget {
  taskId: string;
  title: string;
  budget: number;
  actualCost: number;
  remaining: number;
  actualHours: number;
}

export interface Utilization {
  userId: string;
  userName: string;
  roleName: string;
  forecastHours: number;
  actualHours: number;
  remainingHours: number;
  utilization: number;
}