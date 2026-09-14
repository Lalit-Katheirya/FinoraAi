import { Component, Input } from '@angular/core';

export interface FinoraTableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => string;
}

@Component({
  selector: 'finora-table',
  standalone: true,
  template: `
    <div class="w-full overflow-x-auto rounded-xl border border-[var(--finora-border)]">
      <table class="min-w-full border-collapse text-sm">
        <thead class="bg-[var(--finora-surface-2)] text-left">
          <tr>
            @for (col of columns; track col.key) {
              <th
                class="px-4 py-3 font-semibold text-[var(--finora-text-muted)]"
                [class.text-right]="col.align === 'right'"
                [class.text-center]="col.align === 'center'"
              >
                {{ col.label }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track trackBy($index, row)) {
            <tr class="border-t border-[var(--finora-border)] hover:bg-[var(--finora-surface-2)]/60">
              @for (col of columns; track col.key) {
                <td
                  class="px-4 py-3"
                  [class.text-right]="col.align === 'right'"
                  [class.text-center]="col.align === 'center'"
                >
                  {{ cell(row, col) }}
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class FinoraTable<T extends Record<string, unknown> = Record<string, unknown>> {
  @Input() columns: FinoraTableColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() trackByKey = 'id';

  trackBy(index: number, row: T): string | number {
    const key = row[this.trackByKey];
    return typeof key === 'string' || typeof key === 'number' ? key : index;
  }

  cell(row: T, col: FinoraTableColumn<T>): string {
    if (col.render) return col.render(row);
    const value = row[col.key];
    if (value == null) return '—';
    return String(value);
  }
}
