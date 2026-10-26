# Employee Management UI (Angular 20)

Frontend for the Employee Management API (ASP.NET Core + SQL Server).

## Run
1. Start the API (`dotnet run` in the backend folder).
2. Check `src/app/core/config.ts`: `API_URL` must match the API's HTTPS port.
3. In this folder:
   ```
   npm install
   npm start
   ```
4. Open http://localhost:4200 and sign in (default admin: admin@abc.com).

## Backend requirements
- CORS policy allowing `http://localhost:4200` (Task 7: `AddCors` + `app.UseCors("Frontend")` before `UseAuthentication`).
- Trusted dev certificate: `dotnet dev-certs https --trust`.
- `POST /api/auth/change-password` (Task 7) for the Change Password page.

## Pages and roles
| Page | Route | Roles |
|---|---|---|
| Login | /login | public |
| Dashboard (check in/out, leave summary, team counts) | / | all |
| Employees (search, filters, paging) | /employees | Admin, Manager |
| Add / edit employee | /employees/new, /employees/:id/edit | Admin |
| Departments (+ move employee) | /departments | all (edit: Admin, move: Admin/Manager) |
| My Attendance | /attendance | all |
| All Attendance (filters, paging) | /attendance/all | Admin, Manager |
| My Leaves (apply, cancel) | /leaves | all |
| Leave Approvals (approve / reject) | /leaves/manage | Admin, Manager |
| Create Login | /users | Admin |
| Change Password | /change-password | all |

## Structure
```
src/app/
  core/     config, models, auth service, interceptor, guards, api service, toast, helpers
  layout/   shell (sidebar + topbar)
  shared/   pager
  pages/    login, dashboard, employees, departments, attendance, leaves, users, account
```
