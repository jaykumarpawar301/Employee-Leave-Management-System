import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Attendance, Leave, MessageResponse } from '../../core/models';
import { errMsg } from '../../core/util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <h2>Welcome, {{ auth.session()?.email }}</h2>

    <div class="grid">
      <div class="card">
        <h3>Today's attendance</h3>
        @if (today(); as t) {
          <p>Status: <span [class]="'badge s-' + t.status.toLowerCase()">{{ t.status }}</span></p>
          <p>Check-in: <strong>{{ t.checkIn | date: 'HH:mm' }}</strong></p>
          <p>Check-out: <strong>{{ t.checkOut ? (t.checkOut | date: 'HH:mm') : 'not yet' }}</strong></p>
        } @else {
          <p class="muted">You have not checked in today.</p>
        }
        <div class="row">
          <button class="btn" (click)="checkIn()" [disabled]="busy() || !!today()">Check in</button>
          <button class="btn secondary" (click)="checkOut()" [disabled]="busy() || !today() || !!today()?.checkOut">Check out</button>
        </div>
      </div>

      <div class="card">
        <h3>My leave requests</h3>
        <p><span class="badge s-pending">Pending</span> {{ countLeaves('Pending') }}</p>
        <p><span class="badge s-approved">Approved</span> {{ countLeaves('Approved') }}</p>
        <p><span class="badge s-rejected">Rejected</span> {{ countLeaves('Rejected') }}</p>
        <a class="btn secondary" routerLink="/leaves">Apply or view</a>
      </div>

      @if (isStaff()) {
        <div class="card">
          <h3>Team overview</h3>
          <p>Active employees: <strong>{{ activeEmployees() ?? '...' }}</strong></p>
          <p>Leaves waiting for approval: <strong>{{ pending() ?? '...' }}</strong></p>
          <a class="btn secondary" routerLink="/leaves/manage">Review requests</a>
        </div>
      }
    </div>
  `,
})
export class DashboardPage implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  today = signal<Attendance | null>(null);
  myLeaves = signal<Leave[]>([]);
  pending = signal<number | null>(null);
  activeEmployees = signal<number | null>(null);
  busy = signal(false);
  isStaff = computed(() => this.auth.hasRole('Admin', 'Manager'));

  ngOnInit(): void {
    this.loadToday();
    this.api.myLeaves().subscribe({ next: l => this.myLeaves.set(l), error: e => this.toast.error(errMsg(e)) });
    if (this.isStaff()) {
      this.api.allLeaves({ status: 'Pending', pageSize: 1 }).subscribe(r => this.pending.set(r.totalCount));
      this.api.employees({ isActive: true, pageSize: 1 }).subscribe(r => this.activeEmployees.set(r.totalCount));
    }
  }

  countLeaves(status: string): number {
    return this.myLeaves().filter(l => l.status === status).length;
  }

  private loadToday(): void {
    this.api.attendanceToday().subscribe({
      next: a => this.today.set(a),
      error: (e: HttpErrorResponse) => {
        if (e.status === 404) this.today.set(null);
        else this.toast.error(errMsg(e));
      },
    });
  }

  checkIn(): void { this.run(this.api.checkIn()); }
  checkOut(): void { this.run(this.api.checkOut()); }

  private run(call: Observable<MessageResponse>): void {
    this.busy.set(true);
    call.subscribe({
      next: r => { this.toast.success(r.message); this.busy.set(false); this.loadToday(); },
      error: e => { this.toast.error(errMsg(e)); this.busy.set(false); },
    });
  }
}
