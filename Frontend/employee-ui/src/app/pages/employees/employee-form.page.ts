import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Department } from '../../core/models';
import { errMsg, todayStr } from '../../core/util';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-head"><h2>{{ editId ? 'Edit employee' : 'Add employee' }}</h2></div>

    <form class="card form-grid" [formGroup]="form" (ngSubmit)="save()">
      <div>
        <label>Employee code</label>
        <input formControlName="employeeCode" placeholder="EMP101" />
        @if (show('employeeCode')) { <small class="field-error">Required (max 20 characters).</small> }
      </div>
      <div>
        <label>Full name</label>
        <input formControlName="fullName" />
        @if (show('fullName')) { <small class="field-error">Required (max 150 characters).</small> }
      </div>
      <div>
        <label>Email</label>
        <input type="email" formControlName="email" />
        @if (show('email')) { <small class="field-error">Enter a valid email.</small> }
      </div>
      <div>
        <label>Department</label>
        <select formControlName="departmentId">
          <option [ngValue]="0">Select department</option>
          @for (d of departments(); track d.departmentId) { <option [ngValue]="d.departmentId">{{ d.departmentName }}</option> }
        </select>
        @if (show('departmentId')) { <small class="field-error">Select a department.</small> }
      </div>
      <div>
        <label>Designation</label>
        <input formControlName="designation" />
      </div>
      <div>
        <label>Joining date</label>
        <input type="date" formControlName="joiningDate" />
        @if (show('joiningDate')) { <small class="field-error">Required.</small> }
      </div>

      <div class="form-actions">
        <button class="btn" type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Saving...' : 'Save' }}</button>
        <a class="btn secondary" routerLink="/employees">Cancel</a>
      </div>
    </form>
  `,
})
export class EmployeeFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editId = Number(this.route.snapshot.paramMap.get('id')) || 0;
  departments = signal<Department[]>([]);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    employeeCode: ['', [Validators.required, Validators.maxLength(20)]],
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    departmentId: [0, [Validators.min(1)]],
    designation: [''],
    joiningDate: [todayStr(), Validators.required],
  });

  show(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.touched && c.invalid;
  }

  ngOnInit(): void {
    this.api.departments().subscribe(list => this.departments.set(list.filter(d => d.isActive)));

    if (this.editId) {
      // The code and joining date cannot be changed after creation (backend rule)
      this.form.controls.employeeCode.disable();
      this.form.controls.joiningDate.disable();
      this.api.employee(this.editId).subscribe({
        next: e => this.form.patchValue({
          employeeCode: e.employeeCode, fullName: e.fullName, email: e.email,
          departmentId: e.departmentId, designation: e.designation ?? '', joiningDate: e.joiningDate,
        }),
        error: err => { this.toast.error(errMsg(err)); this.router.navigate(['/employees']); },
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();

    const call: Observable<unknown> = this.editId
      ? this.api.updateEmployee(this.editId, {
          fullName: v.fullName, email: v.email, departmentId: v.departmentId, designation: v.designation,
        })
      : this.api.createEmployee(v);

    call.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Employee updated.' : 'Employee created.');
        this.router.navigate(['/employees']);
      },
      error: err => { this.toast.error(errMsg(err)); this.saving.set(false); },
    });
  }
}
