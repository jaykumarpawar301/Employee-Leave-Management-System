import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Department, Employee } from '../../core/models';
import { errMsg } from '../../core/util';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  template: `
    <div class="page-head"><h2>Departments</h2></div>

    <div class="card table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Description</th><th>Active employees</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (d of departments(); track d.departmentId) {
            <tr>
              <td>{{ d.departmentName }}</td>
              <td>{{ d.description }}</td>
              <td>{{ d.activeEmployeeCount }}</td>
              <td><span [class]="'badge ' + (d.isActive ? 's-approved' : 's-rejected')">{{ d.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td class="actions">
                @if (auth.hasRole('Admin')) {
                  <button class="btn small secondary" (click)="edit(d)">Edit</button>
                  @if (d.isActive) { <button class="btn small danger" (click)="deactivate(d)">Deactivate</button> }
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="muted center">No departments.</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (auth.hasRole('Admin')) {
      <div class="card">
        <h3>{{ editId() ? 'Edit department' : 'Add department' }}</h3>
        <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
          <div>
            <label>Name</label>
            <input formControlName="departmentName" />
          </div>
          <div>
            <label>Description</label>
            <input formControlName="description" />
          </div>
          <div class="form-actions">
            <button class="btn" type="submit" [disabled]="form.invalid">{{ editId() ? 'Update' : 'Add' }}</button>
            @if (editId()) { <button class="btn secondary" type="button" (click)="cancelEdit()">Cancel</button> }
          </div>
        </form>
      </div>
    }

    @if (auth.hasRole('Admin', 'Manager')) {
      <div class="card">
        <h3>Move an employee to a department</h3>
        <div class="form-grid">
          <div>
            <label>Employee</label>
            <select [(ngModel)]="assignEmployee">
              <option [ngValue]="0">Select employee</option>
              @for (e of employees(); track e.employeeId) { <option [ngValue]="e.employeeId">{{ e.fullName }} ({{ e.departmentName }})</option> }
            </select>
          </div>
          <div>
            <label>New department</label>
            <select [(ngModel)]="assignDept">
              <option [ngValue]="0">Select department</option>
              @for (d of activeDepartments(); track d.departmentId) { <option [ngValue]="d.departmentId">{{ d.departmentName }}</option> }
            </select>
          </div>
          <div class="form-actions">
            <button class="btn" (click)="assign()" [disabled]="!assignEmployee || !assignDept">Move employee</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DepartmentsPage implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  departments = signal<Department[]>([]);
  employees = signal<Employee[]>([]);
  editId = signal(0);
  assignEmployee = 0;
  assignDept = 0;

  form = this.fb.nonNullable.group({
    departmentName: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
  });

  activeDepartments = () => this.departments().filter(d => d.isActive);

  ngOnInit(): void {
    this.load();
    this.loadEmployees();
  }

  private loadEmployees(): void {
    // Only Admin and Manager are allowed to list employees (backend rule)
    if (this.auth.hasRole('Admin', 'Manager')) {
      this.api.employees({ isActive: true, pageSize: 100 }).subscribe(r => this.employees.set(r.items));
    }
  }

  load(): void {
    this.api.departments().subscribe({ next: d => this.departments.set(d), error: e => this.toast.error(errMsg(e)) });
  }

  edit(d: Department): void {
    this.editId.set(d.departmentId);
    this.form.patchValue({ departmentName: d.departmentName, description: d.description ?? '' });
  }

  cancelEdit(): void { this.editId.set(0); this.form.reset(); }

  save(): void {
    if (this.form.invalid) return;
    const body = this.form.getRawValue();
    const id = this.editId();
    const call: Observable<unknown> = id ? this.api.updateDepartment(id, body) : this.api.createDepartment(body);
    call.subscribe({
      next: () => { this.toast.success(id ? 'Department updated.' : 'Department added.'); this.cancelEdit(); this.load(); },
      error: e => this.toast.error(errMsg(e)),
    });
  }

  deactivate(d: Department): void {
    if (!confirm(`Deactivate ${d.departmentName}?`)) return;
    this.api.deactivateDepartment(d.departmentId).subscribe({
      next: () => { this.toast.success('Department deactivated.'); this.load(); },
      error: e => this.toast.error(errMsg(e)),
    });
  }

  assign(): void {
    this.api.assignEmployee(this.assignDept, this.assignEmployee).subscribe({
      next: () => {
        this.toast.success('Employee moved.');
        this.assignEmployee = 0; this.assignDept = 0;
        this.load();
        this.loadEmployees();
      },
      error: e => this.toast.error(errMsg(e)),
    });
  }
}
