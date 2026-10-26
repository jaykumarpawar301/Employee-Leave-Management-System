import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Leave, PagedResult } from '../../core/models';
import { errMsg } from '../../core/util';
import { Pager } from '../../shared/pager';

@Component({
  selector: 'app-manage-leaves',
  standalone: true,
  imports: [DatePipe, FormsModule, Pager],
  template: `
    <div class="page-head"><h2>Leave Approvals</h2></div>

    <div class="card filters">
      <div>
        <label>Status</label>
        <select [(ngModel)]="status" (ngModelChange)="reset()">
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
    </div>

    <div class="card table-wrap">
      <table>
        <thead><tr><th>Employee</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Reviewed by</th><th></th></tr></thead>
        <tbody>
          @for (l of data()?.items ?? []; track l.leaveId) {
            <tr>
              <td>{{ l.employeeName }}</td>
              <td>{{ l.startDate | date: 'dd MMM yyyy' }}</td>
              <td>{{ l.endDate | date: 'dd MMM yyyy' }}</td>
              <td>{{ l.totalDays }}</td>
              <td>{{ l.reason }}</td>
              <td><span [class]="'badge s-' + l.status.toLowerCase()">{{ l.status }}</span></td>
              <td>{{ l.reviewedByName ?? '-' }}</td>
              <td class="actions">
                @if (l.status === 'Pending') {
                  @if (l.employeeId === auth.employeeId()) {
                    <span class="muted">Your own request</span>
                  } @else {
                    <button class="btn small" (click)="approve(l)">Approve</button>
                    <button class="btn small danger" (click)="reject(l)">Reject</button>
                  }
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="8" class="muted center">No leave requests.</td></tr>
          }
        </tbody>
      </table>
      @if (data(); as d) {
        <app-pager [page]="d.page" [totalPages]="d.totalPages" [total]="d.totalCount" (pageChange)="goTo($event)" />
      }
    </div>
  `,
})
export class ManageLeavesPage implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  data = signal<PagedResult<Leave> | null>(null);
  status = 'Pending';
  page = 1;

  ngOnInit(): void { this.load(); }

  reset(): void { this.page = 1; this.load(); }
  goTo(p: number): void { this.page = p; this.load(); }

  load(): void {
    this.api.allLeaves({ status: this.status, page: this.page, pageSize: 10 }).subscribe({
      next: r => this.data.set(r),
      error: e => this.toast.error(errMsg(e)),
    });
  }

  approve(l: Leave): void {
    this.api.approveLeave(l.leaveId).subscribe({
      next: r => { this.toast.success(r.message); this.load(); },
      error: e => this.toast.error(errMsg(e)),
    });
  }

  reject(l: Leave): void {
    if (!confirm(`Reject ${l.employeeName}'s leave request?`)) return;
    this.api.rejectLeave(l.leaveId).subscribe({
      next: r => { this.toast.success(r.message); this.load(); },
      error: e => this.toast.error(errMsg(e)),
    });
  }
}
