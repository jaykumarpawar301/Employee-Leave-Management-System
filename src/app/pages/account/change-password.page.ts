import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { errMsg } from '../../core/util';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-head"><h2>Change Password</h2></div>
    <form class="card narrow" [formGroup]="form" (ngSubmit)="save()">
      <label>Current password</label>
      <input type="password" formControlName="currentPassword" autocomplete="current-password" />
      <label>New password (min 8 characters)</label>
      <input type="password" formControlName="newPassword" autocomplete="new-password" />
      <label>Confirm new password</label>
      <input type="password" formControlName="confirm" autocomplete="new-password" />
      @if (form.controls.confirm.touched && form.controls.confirm.value !== form.controls.newPassword.value) {
        <small class="field-error">Passwords do not match.</small>
      }
      <button class="btn" type="submit" style="margin-top:16px" [disabled]="form.invalid || saving()">Update password</button>
    </form>
  `,
})
export class ChangePasswordPage {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  saving = signal(false);
  form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });

  save(): void {
    const v = this.form.getRawValue();
    if (v.newPassword !== v.confirm) { this.toast.error('Passwords do not match.'); return; }
    this.saving.set(true);
    this.api.changePassword(v.currentPassword, v.newPassword).subscribe({
      next: r => { this.toast.success(r.message); this.form.reset(); this.saving.set(false); },
      error: e => { this.toast.error(errMsg(e)); this.saving.set(false); },
    });
  }
}
