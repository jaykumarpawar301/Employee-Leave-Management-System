import { HttpErrorResponse } from '@angular/common/http';

// Turns any backend error into one readable sentence
export function errMsg(err: HttpErrorResponse): string {
  if (err.status === 0) return 'Cannot reach the server. Is the API running?';
  const e = err.error;
  if (e?.message) return e.message;
  if (e?.errors) {
    if (Array.isArray(e.errors)) return e.errors.join(' ');
    return (Object.values(e.errors) as string[][]).flat().join(' ');   // ASP.NET validation errors
  }
  if (e?.title) return e.detail ? `${e.title} ${e.detail}` : e.title;
  if (err.status === 403) return 'You do not have permission to do this.';
  if (err.status === 404) return 'Not found.';
  return 'Something went wrong. Please try again.';
}

// Today as yyyy-MM-dd in the browser's local time
export function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
