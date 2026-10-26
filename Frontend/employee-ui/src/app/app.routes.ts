import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],     // logged-in users are sent to the dashboard
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
  },  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then(m => m.Shell),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },

      { path: 'employees', canActivate: [roleGuard('Admin', 'Manager')],
        loadComponent: () => import('./pages/employees/employees.page').then(m => m.EmployeesPage) },
      { path: 'employees/new', canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./pages/employees/employee-form.page').then(m => m.EmployeeFormPage) },
      { path: 'employees/:id/edit', canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./pages/employees/employee-form.page').then(m => m.EmployeeFormPage) },

      { path: 'departments', loadComponent: () => import('./pages/departments/departments.page').then(m => m.DepartmentsPage) },

      { path: 'attendance', loadComponent: () => import('./pages/attendance/my-attendance.page').then(m => m.MyAttendancePage) },
      { path: 'attendance/all', canActivate: [roleGuard('Admin', 'Manager')],
        loadComponent: () => import('./pages/attendance/all-attendance.page').then(m => m.AllAttendancePage) },

      { path: 'leaves', loadComponent: () => import('./pages/leaves/my-leaves.page').then(m => m.MyLeavesPage) },
      { path: 'leaves/manage', canActivate: [roleGuard('Admin', 'Manager')],
        loadComponent: () => import('./pages/leaves/manage-leaves.page').then(m => m.ManageLeavesPage) },

      { path: 'users', canActivate: [roleGuard('Admin')],
        loadComponent: () => import('./pages/users/create-login.page').then(m => m.CreateLoginPage) },
      { path: 'change-password', loadComponent: () => import('./pages/account/change-password.page').then(m => m.ChangePasswordPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
