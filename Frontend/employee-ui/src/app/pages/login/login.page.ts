import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-wrap">
      <form class="card login-card " [formGroup]="form" (ngSubmit)="submit()">
        <h2>Employee Management System</h2>
        <!-- <p class="muted">Sign in to continue</p> -->

        @if (error()) { <div class="alert">{{ error() }}</div> }

        <label>Email</label>
        <input type="email" formControlName="email" placeholder="admin@abc.com" autocomplete="username" />
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <small class="field-error">Enter a valid email.</small>
        }

        <label>Password</label>
<div class="password-field">
  <input
    [type]="showPassword() ? 'text' : 'password'"
    formControlName="password"
    autocomplete="current-password" />
  <button
    type="button"
    class="toggle-pw"
    (click)="togglePassword()"
    [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
    {{ showPassword() ? 'Hide' : 'Show' }}
  </button>
  
  <button class="btn block" type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Signing in...' : 'Sign in' }}
        </button>
</div>
@if (form.controls.password.touched && form.controls.password.invalid) {
  <small class="field-error">Password is required.</small>
}

      </form>
    </div>
  `,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = signal(false);
  error = signal('');

  showPassword = signal(false);

togglePassword(): void {
  this.showPassword.update(v => !v);
}
  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 0) this.error.set('Cannot reach the server. Is the API running, and is the HTTPS certificate trusted?');
        else if (err.status === 401) this.error.set(err.error?.message ?? 'Invalid email or password.');
        else this.error.set('Something went wrong. Please try again.');
      },
    });
  }
}
