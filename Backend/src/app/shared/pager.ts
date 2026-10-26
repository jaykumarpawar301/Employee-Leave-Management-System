import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pager',
  standalone: true,
  template: `
    <div class="pager">
      <span class="muted">{{ total() }} records</span>
      <span class="spacer"></span>
      <button class="btn secondary" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)">Previous</button>
      <span>Page {{ page() }} of {{ totalPages() || 1 }}</span>
      <button class="btn secondary" [disabled]="page() >= totalPages()" (click)="pageChange.emit(page() + 1)">Next</button>
    </div>
  `,
})
export class Pager {
  page = input.required<number>();
  totalPages = input.required<number>();
  total = input.required<number>();
  pageChange = output<number>();
}
