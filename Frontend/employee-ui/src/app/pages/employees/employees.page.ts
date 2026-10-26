import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Department, Employee, PagedResult } from '../../core/models';
import { errMsg } from '../../core/util';
import { Pager } from '../../shared/pager';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink, Pager],
  template: `
    <div class="page-head">
      <h2>Employees</h2>
      <span class="spacer"></span>
      @if (auth.hasRole('Admin')) { <a class="btn" routerLink="/employees/new">+ Add employee</a> }
    </div>

    <div class="card filters">
      <input placeholder="Search name, email or code" [(ngModel)]="search" (ngModelChange)="onSearch()" />
      <select [(ngModel)]="departmentId" (ngModelChange)="reset()">
        <option [ngValue]="null">All departments</option>
        @for (d of departments(); track d.departmentId) { <option [ngValue]="d.departmentId">{{ d.departmentName }}</option> }
      </select>
      <select [(ngModel)]="isActive" (ngModelChange)="reset()">
        <option [ngValue]="null">All statuses</option>
        <option [ngValue]="true">Active</option>
        <option [ngValue]="false">Inactive</option>
      </select>
      <select [(ngModel)]="pageSize" (ngModelChange)="reset()">
        <option [ngValue]="10">10 per page</option>
        <option [ngValue]="25">25 per page</option>
        <option [ngValue]="50">50 per page</option>
      </select>
    </div>

    <div class="card table-wrap">
      <table>
        <thead>
          <tr><th>Code</th><th>Name</th><th>Email</th><th>Department</th><th>Designation</th><th>Joined</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          @for (e of data()?.items ?? []; track e.employeeId) {
            <tr>
              <td>{{ e.employeeCode }}</td>
              <td>{{ e.fullName }}</td>
              <td>{{ e.email }}</td>
              <td>{{ e.departmentName }}</td>
              <td>{{ e.designation }}</td>
              <td>{{ e.joiningDate | date: 'dd MMM yyyy' }}</td>
              <td><span [class]="'badge ' + (e.isActive ? 's-approved' : 's-rejected')">{{ e.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td class="actions">
                @if (auth.hasRole('Admin')) {
                  <a class="btn small secondary" [routerLink]="['/employees', e.employeeId, 'edit']">Edit</a>
                  @if (e.isActive) { <button class="btn small danger" (click)="deactivate(e)">Deactivate</button> }
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="8" class="muted center">{{ loading() ? 'Loading...' : 'No employees found.' }}</td></tr>
          }
        </tbody>
      </table>
      @if (data(); as d) {
        <app-pager [page]="d.page" [totalPages]="d.totalPages" [total]="d.totalCount" (pageChange)="goTo($event)" />
      }
    </div>
  `,
})
export class EmployeesPage implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  data = signal<PagedResult<Employee> | null>(null);
  departments = signal<Department[]>([]);
  loading = signal(false);

  search = '';
  departmentId: number | null = null;
  isActive: boolean | null = true;
  page = 1;
  pageSize = 10;
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.api.departments().subscribe(d => this.departments.set(d));
    this.load();
  }

  onSearch(): void {               // wait until the user stops typing
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.reset(), 350);
  }

  reset(): void { this.page = 1; this.load(); }
  goTo(p: number): void { this.page = p; this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.employees({
      search: this.search, departmentId: this.departmentId, isActive: this.isActive,
      page: this.page, pageSize: this.pageSize,
    }).subscribe({
      next: r => { this.data.set(r); this.loading.set(false); },
      error: e => { this.toast.error(errMsg(e)); this.loading.set(false); },
    });
  }

  deactivate(e: Employee): void {
    if (!confirm(`Deactivate ${e.fullName}? They will no longer be able to log in.`)) return;
    this.api.deactivateEmployee(e.employeeId).subscribe({
      next: () => { this.toast.success(`${e.fullName} deactivated.`); this.load(); },
      error: err => this.toast.error(errMsg(err)),
    });
  }
}
