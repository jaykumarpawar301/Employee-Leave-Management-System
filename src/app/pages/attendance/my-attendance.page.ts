import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Attendance, MessageResponse } from '../../core/models';
import { errMsg } from '../../core/util';

@Component({
  selector: 'app-my-attendance',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="page-head"><h2>My Attendance</h2></div>

    <div class="card">
      <h3>Today</h3>
      @if (today(); as t) {
        <p>
          Checked in at <strong>{{ t.checkIn | date: 'HH:mm' }}</strong>
          <span [class]="'badge s-' + t.status.toLowerCase()">{{ t.status }}</span>
          @if (t.checkOut) { | Checked out at <strong>{{ t.checkOut | date: 'HH:mm' }}</strong> ({{ t.hoursWorked }} hours) }
        </p>
      } @else {
        <p class="muted">You have not checked in today.</p>
      }
      <div class="row">
        <button class="btn" (click)="run(api.checkIn())" [disabled]="busy() || !!today()">Check in</button>
        <button class="btn secondary" (click)="run(api.checkOut())" [disabled]="busy() || !today() || !!today()?.checkOut">Check out</button>
      </div>
    </div>

    <div class="card filters">
      <div><label>From</label><input type="date" [(ngModel)]="from" /></div>
      <div><label>To</label><input type="date" [(ngModel)]="to" /></div>
      <div class="form-actions"><button class="btn" (click)="load()">Filter</button><button class="btn secondary" (click)="clear()">Clear</button></div>
    </div>

    <div class="card table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Status</th></tr></thead>
        <tbody>
          @for (a of records(); track a.attendanceId) {
            <tr>
              <td>{{ a.workDate | date: 'EEE, dd MMM yyyy' }}</td>
              <td>{{ a.checkIn | date: 'HH:mm' }}</td>
              <td>{{ a.checkOut ? (a.checkOut | date: 'HH:mm') : '-' }}</td>
              <td>{{ a.hoursWorked ?? '-' }}</td>
              <td><span [class]="'badge s-' + a.status.toLowerCase()">{{ a.status }}</span></td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="muted center">No records.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class MyAttendancePage implements OnInit {
  api = inject(ApiService);
  private toast = inject(ToastService);

  today = signal<Attendance | null>(null);
  records = signal<Attendance[]>([]);
  busy = signal(false);
  from = '';
  to = '';

  ngOnInit(): void { this.loadToday(); this.load(); }

  private loadToday(): void {
    this.api.attendanceToday().subscribe({
      next: a => this.today.set(a),
      error: (e: HttpErrorResponse) => { if (e.status === 404) this.today.set(null); else this.toast.error(errMsg(e)); },
    });
  }

  load(): void {
    this.api.myAttendance({ from: this.from, to: this.to }).subscribe({
      next: r => this.records.set(r),
      error: e => this.toast.error(errMsg(e)),
    });
  }

  clear(): void { this.from = ''; this.to = ''; this.load(); }

  run(call: Observable<MessageResponse>): void {
    this.busy.set(true);
    call.subscribe({
      next: r => { this.toast.success(r.message); this.busy.set(false); this.loadToday(); this.load(); },
      error: e => { this.toast.error(errMsg(e)); this.busy.set(false); },
    });
  }
}
