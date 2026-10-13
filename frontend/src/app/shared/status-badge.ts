import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { SubmissionStatus } from '../graphql/schema-types.generated';
import { STATUS_LABEL } from '../core/format';

const STYLE: Record<SubmissionStatus, string> = {
  NEW: 'bg-sky-50 text-sky-800 ring-sky-200',
  IN_REVIEW: 'bg-amber-50 text-amber-800 ring-amber-200',
  QUOTED: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  DECLINED: 'bg-slate-100 text-slate-700 ring-slate-300',
  BOUND: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
};

@Component({
  selector: 'rp-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap"
    [class]="style()"
    data-testid="status-badge"
  >
    <span class="size-1.5 rounded-full bg-current opacity-70"></span>{{ label() }}</span
  >`,
})
export class StatusBadge {
  readonly status = input.required<SubmissionStatus>();
  protected readonly label = computed(() => STATUS_LABEL[this.status()]);
  protected readonly style = computed(() => STYLE[this.status()]);
}
