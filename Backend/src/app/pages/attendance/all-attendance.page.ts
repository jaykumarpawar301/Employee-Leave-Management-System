import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Attendance, Employee, PagedResult } from '../../core/models';
import { errMsg } from '../../core/util';
import { Pager } from '../../shared/pager';

@Component({
  selector: 'app-all-attendance',
  standalone: true,
  imports: [DatePipe, FormsModule, Pager],
  template: `
    <div class="page-head"><h2>All Attendance</h2></div>

    <div class="card filters">
      <div>
        <label>Employee</label>
        <select [(ngModel)]="employeeId" (ngModelChange)="reset()">
          <option [ngValue]="null">All employees</option>
          @for (e of employees(); track e.employeeId) { <option [ngValue]="e.employeeId">{{ e.fullName }}</option> }
        </select>
      </div>
      <div><label>From</label><input type="date" [(ngModel)]="from" (ngModelChange)="reset()" /></div>
      <div><label>To</label><input type="date" [(ngModel)]="to" (ngModelChange)="reset()" /></div>
      <div>
        <label>Per page</label>
        <select [(ngModel)]="pageSize" (ngModelChange)="reset()">
          <option [ngValue]="20">20</option><option [ngValue]="50">50</option><option [ngValue]="100">100</option>
        </select>
      </div>
    </div>

    <div class="card table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Employee</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Status</th></tr></thead>
        <tbody>
          @for (a of data()?.items ?? []; track a.attendanceId) {
            <tr>
              <td>{{ a.workDate | date: 'dd MMM yyyy' }}</td>
              <td>{{ a.employeeName }}</td>
              <td>{{ a.checkIn | date: 'HH:mm' }}</td>
              <td>{{ a.checkOut ? (a.checkOut | date: 'HH:mm') : '-' }}</td>
              <td>{{ a.hoursWorked ?? '-' }}</td>
              <td><span [class]="'badge s-' + a.status.toLowerCase()">{{ a.status }}</span></td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="muted center">No records.</td></tr>
          }
        </tbody>
      </table>
      @if (data(); as d) {
        <app-pager [page]="d.page" [totalPages]="d.totalPages" [total]="d.totalCount" (pageChange)="goTo($event)" />
      }
    </div>
  `,
})
export class AllAttendancePage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  data = signal<PagedResult<Attendance> | null>(null);
  employees = signal<Employee[]>([]);
  employeeId: number | null = null;
  from = '';
  to = '';
  page = 1;
  pageSize = 20;

  ngOnInit(): void {
    this.api.employees({ pageSize: 100 }).subscribe(r => this.employees.set(r.items));
    this.load();
  }

  reset(): void { this.page = 1; this.load(); }
  goTo(p: number): void { this.page = p; this.load(); }

  load(): void {
    this.api.allAttendance({
      employeeId: this.employeeId, from: this.from, to: this.to, page: this.page, pageSize: this.pageSize,
    }).subscribe({ next: r => this.data.set(r), error: e => this.toast.error(errMsg(e)) });
  }
}
