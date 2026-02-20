
export type Status = 'Complete' | 'Pending';

export type Role = 'Admin' | 'User';

// Added TaskType and Area definitions to fix "no exported member" errors in constants.ts and Dashboard.tsx
export type TaskType = string;
export type Area = string;

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface Task {
  id: string;
  serialNo: number;
  date: string;
  userId: string;
  taskType: TaskType;
  area: Area;
  status: Status;
  month: string;
  createdBy: string;
  completedBy?: string;
  remarks?: string;
}

export interface TaskStats {
  total: number;
  complete: number;
  pending: number;
  byArea: Record<string, number>;
  byMonth: Record<string, number>;
}
