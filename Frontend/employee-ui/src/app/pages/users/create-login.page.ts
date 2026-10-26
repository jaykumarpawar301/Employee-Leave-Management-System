import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Employee } from '../../core/models';
import { errMsg } from '../../core/util';

@Component({
  selector: 'app-create-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-head"><h2>Create Login</h2></div>
    <p class="muted">Give an existing employee a login account and a role.</p>

    <form class="card form-grid" [formGroup]="form" (ngSubmit)="save()">
      <div>
        <label>Employee</label>
        <select formControlName="employeeId" (change)="onEmployee()">
          <option [ngValue]="0">Select employee</option>
          @for (e of employees(); track e.employeeId) { <option [ngValue]="e.employeeId">{{ e.fullName }} ({{ e.employeeCode }})</option> }
        </select>
      </div>
      <div>
        <label>Login email</label>
        <input type="email" formControlName="email" />
      </div>
      <div>
        <label>Temporary password (min 8 characters)</label>
        <input type="text" formControlName="password" autocomplete="new-password" />
      </div>
      <div>
        <label>Role</label>
        <select formControlName="role">
          <option value="Employee">Employee</option>
          <option value="Manager">Manager</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      <div class="form-actions">
        <button class="btn" type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Creating...' : 'Create login' }}</button>
      </div>
    </form>
  `,
})
export class CreateLoginPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  employees = signal<Employee[]>([]);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    employeeId: [0, Validators.min(1)],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['Employee', Validators.required],
  });

  ngOnInit(): void {
    this.api.employees({ isActive: true, pageSize: 100 }).subscribe(r => this.employees.set(r.items));
  }

  // Pre-fill the login email with the employee's email
  onEmployee(): void {
    const emp = this.employees().find(e => e.employeeId === this.form.controls.employeeId.value);
    if (emp) this.form.patchValue({ email: emp.email });
  }

  save(): void {
    this.saving.set(true);
    this.api.register(this.form.getRawValue()).subscribe({
      next: r => { this.toast.success(r.message); this.form.reset({ employeeId: 0, email: '', password: '', role: 'Employee' }); this.saving.set(false); },
      error: e => { this.toast.error(errMsg(e)); this.saving.set(false); },
    });
  }
}
