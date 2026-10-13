import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface BarRow {
  label: string;
  value: number;
  display: string;
}

/**
 * Horizontal single-series bar chart (one hue, values on a shared zero baseline).
 * Each bar has a hover/focus tooltip and the chart can switch to a table view.
 */
@Component({
  selector: 'rp-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between gap-3">
      <h3 class="card-title">{{ title() }}</h3>
      <button
        type="button"
        class="text-xs font-medium text-deck-500 underline-offset-2 hover:text-deck-800 hover:underline"
        (click)="asTable.set(!asTable())"
        [attr.aria-pressed]="asTable()"
      >
        {{ asTable() ? 'Show chart' : 'Show table' }}
      </button>
    </div>
    @if (asTable()) {
      <table class="mt-4 w-full text-sm">
        <thead>
          <tr>
            <th class="py-1 text-left font-medium text-deck-500">{{ categoryLabel() }}</th>
            <th class="py-1 text-right font-medium text-deck-500">{{ valueLabel() }}</th>
          </tr>
        </thead>
        <tbody>
          @for (r of rows(); track r.label) {
            <tr class="border-t border-deck-100">
              <td class="py-1.5">{{ r.label }}</td>
              <td class="py-1.5 text-right tabular-nums">{{ r.display }}</td>
            </tr>
          }
        </tbody>
      </table>
    } @else {
      <ul class="mt-4 space-y-2.5" role="list" [attr.aria-label]="title()">
        @for (r of rows(); track r.label) {
          <li
            class="group relative grid grid-cols-[8.5rem_1fr_auto] items-center gap-3 text-sm"
            tabindex="0"
            [attr.aria-label]="r.label + ': ' + r.display"
          >
            <span class="truncate text-deck-600">{{ r.label }}</span>
            <span class="h-5 border-l border-deck-200">
              <span
                class="block h-full rounded-r-[4px] bg-series-1 transition-opacity group-hover:opacity-85"
                [style.width.%]="pct(r.value)"
              ></span>
            </span>
            <span class="w-16 text-right font-medium tabular-nums text-deck-800">{{
              r.display
            }}</span>
            <span
              role="tooltip"
              class="pointer-events-none absolute -top-8 left-36 z-10 hidden rounded-md bg-deck-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow group-hover:block group-focus:block"
            >
              {{ r.label }} · <strong>{{ r.display }}</strong
              >{{ share(r.value) }}
            </span>
          </li>
        }
      </ul>
    }
  `,
})
export class BarChart {
  readonly title = input.required<string>();
  readonly rows = input.required<BarRow[]>();
  readonly categoryLabel = input('Category');
  readonly valueLabel = input('Value');
  protected readonly asTable = signal(false);
  private readonly max = computed(() => Math.max(1, ...this.rows().map((r) => r.value)));
  private readonly total = computed(() => this.rows().reduce((s, r) => s + r.value, 0));

  protected pct(v: number): number {
    return (v / this.max()) * 100;
  }

  protected share(v: number): string {
    const t = this.total();
    return t > 0 ? ` (${Math.round((v / t) * 100)}% of total)` : '';
  }
}
