import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly toasts = signal<ToastMessage[]>([]);

  show(text: string, kind: ToastKind = 'info', ms = 3200): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, kind, text }]);
    window.setTimeout(() => this.dismiss(id), ms);
  }

  success(text: string): void {
    this.show(text, 'success');
  }

  error(text: string): void {
    this.show(text, 'error', 4500);
  }

  info(text: string): void {
    this.show(text, 'info');
  }

  warning(text: string): void {
    this.show(text, 'warning');
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
