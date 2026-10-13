import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { LINE_LABEL, STATUS_LABEL, dateTime, usdCompact } from '../../core/format';
import { BarChart, BarRow } from '../../shared/bar-chart';

@Component({
  selector: 'rp-dashboard',
  imports: [BarChart, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-sm text-deck-500">Portfolio pulse across all submissions.</p>
      </div>
      <a routerLink="/app/submissions" class="btn-primary">Open inbox</a>
    </header>

    @if (data.error()) {
      <div class="card p-6 text-sm text-red-700" role="alert">
        Could not load the dashboard. {{ data.error()?.message }}
      </div>
    } @else if (data.value(); as d) {
      <section class="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Key metrics">
        <div class="card p-5" data-testid="kpi-open">
          <div class="card-title">Open submissions</div>
          <div class="mt-2 text-3xl font-bold tabular-nums">{{ open() }}</div>
          <div class="mt-1 text-xs text-deck-500">
            of {{ d.totalSubmissions }} total · New + In review
          </div>
        </div>
        <div class="card p-5" data-testid="kpi-ttd">
          <div class="card-title">Avg. time to decision</div>
          <div class="mt-2 text-3xl font-bold tabular-nums">
            {{ days() }}<span class="ml-1 text-base font-medium text-deck-500">days</span>
          </div>
          <div class="mt-1 text-xs text-deck-500">
            {{ d.avgHoursToDecision }} h from receipt to quote/decline
          </div>
        </div>
        <div class="card p-5" data-testid="kpi-bind">
          <div class="card-title">Quote-to-bind</div>
          <div class="mt-2 text-3xl font-bold tabular-nums">{{ pct(d.quoteToBindRatio) }}</div>
          <div class="mt-1 text-xs text-deck-500">Bound ÷ (Quoted + Bound)</div>
        </div>
        <div class="card p-5" data-testid="kpi-ai">
          <div class="card-title">AI acceptance</div>
          <div class="mt-2 text-3xl font-bold tabular-nums">
            {{ d.aiAcceptanceRate === null ? '—' : pct(d.aiAcceptanceRate) }}
          </div>
          <div class="mt-1 text-xs text-deck-500">
            {{ d.decisionsRecorded }} AI-assisted decision{{ d.decisionsRecorded === 1 ? '' : 's' }}
          </div>
        </div>
      </section>

      <section class="mt-6 grid gap-4 lg:grid-cols-3">
        <div class="card p-5">
          <rp-bar-chart
            title="Submissions by status"
            [rows]="statusRows()"
            categoryLabel="Status"
            valueLabel="Submissions"
          />
        </div>
        <div class="card p-5">
          <rp-bar-chart
            title="Submissions by line"
            [rows]="lineCountRows()"
            categoryLabel="Line of business"
            valueLabel="Submissions"
          />
        </div>
        <div class="card p-5">
          <rp-bar-chart
            title="Premium by line"
            [rows]="linePremiumRows()"
            categoryLabel="Line of business"
            valueLabel="Premium"
          />
        </div>
      </section>

      <section class="card mt-6 p-5">
        <div class="flex items-center justify-between">
          <h2 class="card-title">Recent activity</h2>
          <a routerLink="/app/audit" class="text-xs font-medium text-deck-500 hover:text-deck-900"
            >Full audit log →</a
          >
        </div>
        <ul class="mt-3 divide-y divide-deck-100">
          @for (e of activity.value() ?? []; track e.id) {
            <li
              class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-sm"
            >
              <span class="min-w-0">
                <span class="font-mono text-xs text-deck-500">{{ e.action }}</span>
                @if (e.entityType === 'SUBMISSION') {
                  <a
                    class="ml-2 font-medium hover:underline"
                    [routerLink]="['/app/submissions', e.entityId]"
                    >{{ e.entityId }}</a
                  >
                } @else {
                  <span class="ml-2 font-medium">Rule {{ e.entityId }}</span>
                }
                <span class="ml-2 text-deck-600">{{ e.details }}</span>
              </span>
              <span class="text-xs whitespace-nowrap text-deck-400"
                >{{ e.actor }} · {{ when(e.createdAt) }}</span
              >
            </li>
          }
        </ul>
      </section>
    } @else {
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy="true">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="card h-28 animate-pulse"></div>
        }
      </div>
    }
  `,
})
export class Dashboard {
  private readonly api = inject(ApiService);
  protected readonly data = rxResource({ stream: () => this.api.dashboard() });
  protected readonly activity = rxResource({ stream: () => this.api.auditLog(8) });

  protected readonly open = computed(() =>
    (this.data.value()?.byStatus ?? [])
      .filter((s) => s.status === 'NEW' || s.status === 'IN_REVIEW')
      .reduce((a, s) => a + s.count, 0),
  );
  protected readonly days = computed(() =>
    ((this.data.value()?.avgHoursToDecision ?? 0) / 24).toFixed(1),
  );
  protected readonly statusRows = computed<BarRow[]>(() =>
    (this.data.value()?.byStatus ?? []).map((s) => ({
      label: STATUS_LABEL[s.status],
      value: s.count,
      display: String(s.count),
    })),
  );
  protected readonly lineCountRows = computed<BarRow[]>(() =>
    (this.data.value()?.byLine ?? []).map((l) => ({
      label: LINE_LABEL[l.lineOfBusiness],
      value: l.count,
      display: String(l.count),
    })),
  );
  protected readonly linePremiumRows = computed<BarRow[]>(() =>
    (this.data.value()?.byLine ?? []).map((l) => ({
      label: LINE_LABEL[l.lineOfBusiness],
      value: l.premium,
      display: usdCompact(l.premium),
    })),
  );

  protected pct(v: number): string {
    return `${Math.round(v * 100)}%`;
  }

  protected when(iso: string): string {
    return dateTime(iso);
  }
}
