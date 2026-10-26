import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';
import { Leave } from '../../core/models';
import { errMsg, todayStr } from '../../core/util';

@Component({
  selector: 'app-my-leaves',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <div class="page-head"><h2>My Leaves</h2></div>

    <div class="card">
      <h3>Apply for leave</h3>
      <form class="form-grid" [formGroup]="form" (ngSubmit)="apply()">
        <div>
          <label>Start date</label>
          <input type="date" formControlName="startDate" [min]="today" />
        </div>
        <div>
          <label>End date</label>
          <input type="date" formControlName="endDate" [min]="form.controls.startDate.value || today" />
        </div>
        <div class="span-2">
          <label>Reason</label>
          <textarea rows="2" formControlName="reason" maxlength="500"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn" type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Submitting...' : 'Submit request' }}</button>
        </div>
      </form>
    </div>

    <div class="card table-wrap">
      <table>
        <thead><tr><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Reviewed by</th><th></th></tr></thead>
        <tbody>
          @for (l of leaves(); track l.leaveId) {
            <tr>
              <td>{{ l.startDate | date: 'dd MMM yyyy' }}</td>
              <td>{{ l.endDate | date: 'dd MMM yyyy' }}</td>
              <td>{{ l.totalDays }}</td>
              <td>{{ l.reason }}</td>
              <td><span [class]="'badge s-' + l.status.toLowerCase()">{{ l.status }}</span></td>
              <td>{{ l.reviewedByName ?? '-' }}</td>
              <td class="actions">
                @if (l.status === 'Pending') { <button class="btn small danger" (click)="cancel(l)">Cancel</button> }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="muted center">You have not applied for any leave.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class MyLeavesPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  today = todayStr();
  leaves = signal<Leave[]>([]);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    startDate: [todayStr(), Validators.required],
    endDate: [todayStr(), Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.myLeaves().subscribe({ next: l => this.leaves.set(l), error: e => this.toast.error(errMsg(e)) });
  }

  apply(): void {
    const v = this.form.getRawValue();
    if (v.endDate < v.startDate) { this.toast.error('End date cannot be before start date.'); return; }
    this.saving.set(true);
    this.api.applyLeave(v).subscribe({
      next: r => {
        this.toast.success(r.message);
        this.form.patchValue({ reason: '' });
        this.saving.set(false);
        this.load();
      },
      error: e => { this.toast.error(errMsg(e)); this.saving.set(false); },
    });
  }

  cancel(l: Leave): void {
    if (!confirm('Cancel this leave request?')) return;
    this.api.cancelLeave(l.leaveId).subscribe({
      next: () => { this.toast.success('Leave request cancelled.'); this.load(); },
      error: e => this.toast.error(errMsg(e)),
    });
  }
}
