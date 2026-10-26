import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from './config';
import { Attendance, Department, Employee, Leave, MessageResponse, PagedResult } from './models';

type Query = Record<string, string | number | boolean | null | undefined>;

// Builds ?a=1&b=2 and skips empty values
function toParams(q: Query): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
  }
  return p;
}

export interface EmployeeCreate {
  employeeCode: string; fullName: string; email: string;
  departmentId: number; designation: string; joiningDate: string;
}
export interface EmployeeUpdate { fullName: string; email: string; departmentId: number; designation: string; }
export interface DepartmentSave { departmentName: string; description: string; }
export interface RegisterRequest { email: string; password: string; role: string; employeeId: number; }
export interface ApplyLeave { startDate: string; endDate: string; reason: string; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ---- Auth ----
  register(body: RegisterRequest) {
    return this.http.post<MessageResponse>(`${API_URL}/auth/register`, body);
  }
  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<MessageResponse>(`${API_URL}/auth/change-password`, { currentPassword, newPassword });
  }

  // ---- Departments ----
  departments() { return this.http.get<Department[]>(`${API_URL}/departments`); }
  createDepartment(b: DepartmentSave) { return this.http.post<Department>(`${API_URL}/departments`, b); }
  updateDepartment(id: number, b: DepartmentSave) { return this.http.put<void>(`${API_URL}/departments/${id}`, b); }
  assignEmployee(deptId: number, employeeId: number) {
    return this.http.put<void>(`${API_URL}/departments/${deptId}/assign/${employeeId}`, {});
  }
  deactivateDepartment(id: number) { return this.http.patch<void>(`${API_URL}/departments/${id}/deactivate`, {}); }

  // ---- Employees ----
  employees(q: Query) { return this.http.get<PagedResult<Employee>>(`${API_URL}/employees`, { params: toParams(q) }); }
  employee(id: number) { return this.http.get<Employee>(`${API_URL}/employees/${id}`); }
  createEmployee(b: EmployeeCreate) { return this.http.post<Employee>(`${API_URL}/employees`, b); }
  updateEmployee(id: number, b: EmployeeUpdate) { return this.http.put<void>(`${API_URL}/employees/${id}`, b); }
  deactivateEmployee(id: number) { return this.http.patch<void>(`${API_URL}/employees/${id}/deactivate`, {}); }

  // ---- Attendance ----
  checkIn() { return this.http.post<MessageResponse>(`${API_URL}/attendance/check-in`, {}); }
  checkOut() { return this.http.post<MessageResponse>(`${API_URL}/attendance/check-out`, {}); }
  attendanceToday() { return this.http.get<Attendance>(`${API_URL}/attendance/today`); }
  myAttendance(q: Query) { return this.http.get<Attendance[]>(`${API_URL}/attendance/my`, { params: toParams(q) }); }
  allAttendance(q: Query) { return this.http.get<PagedResult<Attendance>>(`${API_URL}/attendance`, { params: toParams(q) }); }

  // ---- Leaves ----
  applyLeave(b: ApplyLeave) { return this.http.post<MessageResponse>(`${API_URL}/leaves`, b); }
  myLeaves() { return this.http.get<Leave[]>(`${API_URL}/leaves/my`); }
  allLeaves(q: Query) { return this.http.get<PagedResult<Leave>>(`${API_URL}/leaves`, { params: toParams(q) }); }
  approveLeave(id: number) { return this.http.patch<MessageResponse>(`${API_URL}/leaves/${id}/approve`, {}); }
  rejectLeave(id: number) { return this.http.patch<MessageResponse>(`${API_URL}/leaves/${id}/reject`, {}); }
  cancelLeave(id: number) { return this.http.delete<void>(`${API_URL}/leaves/${id}`); }
}
