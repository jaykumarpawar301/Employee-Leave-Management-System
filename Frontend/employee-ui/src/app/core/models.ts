export type Role = 'Admin' | 'Manager' | 'Employee';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LoginResponse {
  token: string;
  expiresAtUtc: string;
  email: string;
  employeeId: number | null;
  roles: string[];
}

export interface Department {
  departmentId: number;
  departmentName: string;
  description: string | null;
  isActive: boolean;
  activeEmployeeCount: number;
}

export interface Employee {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  email: string;
  departmentId: number;
  departmentName: string;
  designation: string | null;
  joiningDate: string;
  isActive: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Attendance {
  attendanceId: number;
  employeeId: number;
  employeeName: string;
  workDate: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  hoursWorked: number | null;
}

export interface Leave {
  leaveId: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  approvedByEmployeeId: number | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  totalDays: number;
}

export interface MessageResponse {
  message: string;
}
