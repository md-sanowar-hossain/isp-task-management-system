
import { TaskType, Area, Status } from './types';

export const TASK_TYPES: TaskType[] = [
  'New Line/Line Shift',
  'Red Signal',
  'Physical Support',
  'No Internet',
  'Speed Issue',
  'ONU Fiber Remove',
  'Router Setup',
  'Reconnection',
  'Test Router Collect',
  'Auto Disconnect',
  'Onu Problem',
  'User Update'
];

export const AREAS: Area[] = ['Rampura', 'Banasree', 'Bhola'];

export const STATUSES: Status[] = ['Complete', 'Pending'];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// DKLink Primary Colors based on logo
export const COLORS = {
  primary: '#e11d48', // Brand Red
  secondary: '#0f172a', // Brand Dark Slate/Black
  accent: '#fb7185',
  chart: ['#e11d48', '#1e293b', '#475569', '#94a3b8', '#f43f5e']
};
