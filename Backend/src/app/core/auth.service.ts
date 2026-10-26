import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from './config';
import { LoginResponse, Role } from './models';

const STORAGE_KEY = 'ems_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _session = signal<LoginResponse | null>(this.load());

  readonly session = this._session.asReadonly();
  readonly roles = computed(() => this._session()?.roles ?? []);
  readonly employeeId = computed(() => this._session()?.employeeId ?? null);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        this._session.set(res);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._session.set(null);
    this.router.navigate(['/login']);
  }

  token(): string | null {
    return this._session()?.token ?? null;
  }

  isAuthenticated(): boolean {
    const s = this._session();
    if (!s) return false;
    if (new Date(s.expiresAtUtc).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      this._session.set(null);
      return false;
    }
    return true;
  }

  hasRole(...roles: Role[]): boolean {
    return this.roles().some(r => roles.includes(r as Role));
  }

  private load(): LoginResponse | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as LoginResponse;
      return new Date(s.expiresAtUtc).getTime() > Date.now() ? s : null;
    } catch {
      return null;
    }
  }
}
