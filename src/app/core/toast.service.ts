import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; text: string; type: 'success' | 'error'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly items = signal<Toast[]>([]);
  private n = 0;

  success(text: string) { this.push(text, 'success'); }
  error(text: string) { this.push(text, 'error'); }

  private push(text: string, type: Toast['type']) {
    const id = ++this.n;
    this.items.update(l => [...l, { id, text, type }]);
    setTimeout(() => this.items.update(l => l.filter(t => t.id !== id)), 4500);
  }
}
