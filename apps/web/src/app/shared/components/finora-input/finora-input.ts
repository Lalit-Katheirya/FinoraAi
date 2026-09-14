import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'finora-input',
  standalone: true,
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FinoraInput),
      multi: true,
    },
  ],
  template: `
    <label class="flex w-full flex-col gap-1.5 text-sm">
      @if (label) {
        <span class="font-medium text-[var(--finora-text)]">{{ label }}</span>
      }
      @if (type === 'textarea') {
        <textarea
          class="min-h-24 w-full rounded-xl border border-[var(--finora-border)] bg-[var(--finora-surface)]
                 px-3 py-2.5 text-[var(--finora-text)] outline-none transition
                 placeholder:text-[var(--finora-text-muted)]
                 focus:border-[var(--finora-primary)] focus:ring-2 focus:ring-[var(--finora-primary-muted)]"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [rows]="rows"
          [(ngModel)]="value"
          (ngModelChange)="onChange($event)"
          (blur)="onTouched()"
        ></textarea>
      } @else {
        <input
          class="w-full rounded-xl border border-[var(--finora-border)] bg-[var(--finora-surface)]
                 px-3 py-2.5 text-[var(--finora-text)] outline-none transition
                 placeholder:text-[var(--finora-text-muted)]
                 focus:border-[var(--finora-primary)] focus:ring-2 focus:ring-[var(--finora-primary-muted)]"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [attr.min]="min"
          [attr.max]="max"
          [attr.step]="step"
          [(ngModel)]="value"
          (ngModelChange)="onChange($event)"
          (blur)="onTouched()"
        />
      }
      @if (hint) {
        <span class="finora-muted text-xs">{{ hint }}</span>
      }
      @if (error) {
        <span class="text-xs text-[var(--finora-danger)]">{{ error }}</span>
      }
    </label>
  `,
})
export class FinoraInput implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: string = 'text';
  @Input() hint = '';
  @Input() error = '';
  @Input() rows = 3;
  @Input() min: string | number | null = null;
  @Input() max: string | number | null = null;
  @Input() step: string | number | null = null;
  @Input() disabled = false;

  value = '';

  private onChangeFn: (v: string) => void = () => undefined;
  private onTouchedFn: () => void = () => undefined;

  writeValue(value: string | number | null): void {
    this.value = value == null ? '' : String(value);
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onChange(value: string): void {
    this.onChangeFn(value);
  }

  onTouched(): void {
    this.onTouchedFn();
  }
}
