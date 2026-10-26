import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { Role } from '../core/models';

interface NavItem { label: string; link: string; roles?: Role[]; exact?: boolean; }

const NAV: NavItem[] = [
  { label: 'Dashboard', link: '/', exact: true },
  { label: 'Employees', link: '/employees', roles: ['Admin', 'Manager'] },
  { label: 'Departments', link: '/departments' },
  { label: 'My Attendance', link: '/attendance', exact: true },
  { label: 'All Attendance', link: '/attendance/all', roles: ['Admin', 'Manager'] },
  { label: 'My Leaves', link: '/leaves', exact: true },
  { label: 'Leave Approvals', link: '/leaves/manage', roles: ['Admin', 'Manager'] },
  { label: 'Create Login', link: '/users', roles: ['Admin'] },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">EMS</div>
        @for (item of nav(); track item.link) {
          <a [routerLink]="item.link" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: !!item.exact }">
            {{ item.label }}
          </a>
        }
      </aside>

      <div class="main">
        <header class="topbar">
          <strong>Employee Management System</strong>
          <span class="spacer"></span>
          <span class="hide-sm">{{ auth.session()?.email }}</span>
          <span class="badge">{{ auth.roles().join(', ') }}</span>
          <a class="link-light" routerLink="/change-password">Change password</a>
          <button class="btn secondary" (click)="auth.logout()">Logout</button>
        </header>
        <main class="content"><router-outlet /></main>
      </div>
    </div>

    <div class="toasts">
      @for (t of toast.items(); track t.id) {
        <div class="toast" [class.err]="t.type === 'error'">{{ t.text }}</div>
      }
    </div>
  `,
})
export class Shell {
  auth = inject(AuthService);
  toast = inject(ToastService);
  nav = computed(() => NAV.filter(i => !i.roles || this.auth.hasRole(...i.roles)));
}
