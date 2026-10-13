import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ApiService } from '../../core/api.service';
import {
  LINES,
  LINE_LABEL,
  STATUSES,
  STATUS_LABEL,
  shortDate,
  usd,
  usdCompact,
} from '../../core/format';
import type { LineOfBusiness, SubmissionStatus } from '../../graphql/schema-types.generated';
import { StatusBadge } from '../../shared/status-badge';

const PAGE_SIZE = 10;

interface InboxParams {
  search: string;
  statuses: SubmissionStatus[];
  line: LineOfBusiness | '';
  page: number;
}

/** Inbox state lives in the URL (?q=&status=&line=&page=) so filters survive navigation and are shareable. */
@Component({
  selector: 'rp-inbox',
  imports: [RouterLink, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-5">
      <h1 class="text-2xl font-bold tracking-tight">Submissions</h1>
      <p class="text-sm text-deck-500">Commercial P&amp;C submissions received from brokers.</p>
    </header>

    <div class="card mb-4 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
      <label class="relative flex-1">
        <span class="sr-only">Search submissions</span>
        <svg
          viewBox="0 0 24 24"
          class="pointer-events-none absolute top-2.5 left-3 size-4 text-deck-400"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          class="input pl-9"
          type="search"
          placeholder="Search applicant, reference, broker or city"
          data-testid="search"
          [value]="searchText()"
          (input)="onSearch($any($event.target).value)"
        />
      </label>
      <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
        @for (s of statuses; track s) {
          <button
            type="button"
            class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            [class]="
              isActive(s)
                ? 'border-deck-900 bg-deck-900 text-white'
                : 'border-deck-200 bg-white text-deck-700 hover:border-deck-400'
            "
            [attr.aria-pressed]="isActive(s)"
            [attr.data-testid]="'filter-' + s"
            (click)="toggleStatus(s)"
          >
            {{ statusLabel[s] }}
          </button>
        }
      </div>
      <label class="lg:w-52">
        <span class="sr-only">Line of business</span>
        <select
          class="input"
          data-testid="filter-line"
          [value]="params().line"
          (change)="setLine($any($event.target).value)"
        >
          <option value="">All lines</option>
          @for (l of lines; track l) {
            <option [value]="l">{{ lineLabel[l] }}</option>
          }
        </select>
      </label>
    </div>

    <div class="card overflow-hidden">
      <div class="relative overflow-x-auto">
        <table class="w-full min-w-[56rem]">
          <thead class="border-b border-deck-100 bg-deck-50/60">
            <tr>
              <th class="table-head">Reference</th>
              <th class="table-head">Applicant</th>
              <th class="table-head">Broker</th>
              <th class="table-head">Line</th>
              <th class="table-head text-right">TIV</th>
              <th class="table-head text-right">Premium</th>
              <th class="table-head">Received</th>
              <th class="table-head">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-deck-100" [class.opacity-60]="result.isLoading()">
            @for (s of result.value()?.items ?? []; track s.id) {
              <tr
                class="cursor-pointer hover:bg-deck-50"
                data-testid="submission-row"
                (click)="open(s.id)"
              >
                <td class="table-cell font-mono text-xs whitespace-nowrap text-deck-500">
                  {{ s.reference }}
                </td>
                <td class="table-cell">
                  <a
                    class="font-medium text-deck-900 hover:underline"
                    [routerLink]="['/app/submissions', s.id]"
                    (click)="$event.stopPropagation()"
                    >{{ s.applicant.name }}</a
                  >
                  <div class="text-xs text-deck-500">
                    {{ s.applicant.city }}, {{ s.applicant.state }}
                  </div>
                </td>
                <td class="table-cell">
                  <div>{{ s.broker.name }}</div>
                  <div class="text-xs text-deck-500">{{ s.broker.agency }}</div>
                </td>
                <td class="table-cell whitespace-nowrap">{{ lineLabel[s.lineOfBusiness] }}</td>
                <td class="table-cell text-right tabular-nums">{{ compact(s.property.tiv) }}</td>
                <td class="table-cell text-right tabular-nums">{{ money(s.premium) }}</td>
                <td class="table-cell whitespace-nowrap text-deck-600">{{ date(s.receivedAt) }}</td>
                <td class="table-cell"><rp-status-badge [status]="s.status" /></td>
              </tr>
            } @empty {
              @if (!result.isLoading()) {
                <tr>
                  <td
                    colspan="8"
                    class="px-4 py-12 text-center text-sm text-deck-500"
                    data-testid="empty"
                  >
                    No submissions match these filters.
                    <button
                      type="button"
                      class="font-medium text-deck-900 underline"
                      (click)="clear()"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
      @if (result.error()) {
        <div class="border-t border-deck-100 p-4 text-sm text-red-700" role="alert">
          Could not load submissions: {{ result.error()?.message }}
        </div>
      }
      <footer class="flex items-center justify-between border-t border-deck-100 px-4 py-3 text-sm">
        <span class="text-deck-500" data-testid="page-info">{{ rangeText() }}</span>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-ghost py-1.5"
            [disabled]="params().page === 0"
            (click)="goTo(params().page - 1)"
            data-testid="prev-page"
          >
            Previous
          </button>
          <button
            type="button"
            class="btn-ghost py-1.5"
            [disabled]="!hasNext()"
            (click)="goTo(params().page + 1)"
            data-testid="next-page"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  `,
})
export class Inbox {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly statuses = STATUSES;
  protected readonly lines = LINES;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly lineLabel = LINE_LABEL;

  protected readonly params = toSignal(
    this.route.queryParamMap.pipe(
      map((q): InboxParams => ({
        search: q.get('q') ?? '',
        statuses: (q.get('status') ?? '')
          .split(',')
          .filter((s): s is SubmissionStatus => STATUSES.includes(s as SubmissionStatus)),
        line: LINES.includes(q.get('line') as LineOfBusiness)
          ? (q.get('line') as LineOfBusiness)
          : '',
        page: Math.max(0, Number(q.get('page') ?? 0) || 0),
      })),
    ),
    { requireSync: true },
  );
  protected readonly searchText = signal(this.params().search);

  protected readonly result = rxResource({
    params: () => this.params(),
    stream: ({ params: p }) =>
      this.api.submissions(
        {
          search: p.search || null,
          statuses: p.statuses.length ? p.statuses : null,
          lines: p.line ? [p.line] : null,
        },
        p.page,
        PAGE_SIZE,
      ),
  });

  protected readonly hasNext = computed(() => {
    const r = this.result.value();
    return !!r && (r.page + 1) * r.size < r.total;
  });

  protected readonly rangeText = computed(() => {
    const r = this.result.value();
    if (!r) return 'Loading…';
    if (r.total === 0) return '0 submissions';
    return `${r.page * r.size + 1}–${Math.min((r.page + 1) * r.size, r.total)} of ${r.total}`;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
  }

  protected isActive(s: SubmissionStatus): boolean {
    return this.params().statuses.includes(s);
  }

  protected onSearch(value: string): void {
    this.searchText.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.update({ q: value.trim() || null, page: null }), 250);
  }

  protected toggleStatus(s: SubmissionStatus): void {
    const current = this.params().statuses;
    const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
    this.update({ status: next.length ? next.join(',') : null, page: null });
  }

  protected setLine(line: string): void {
    this.update({ line: line || null, page: null });
  }

  protected goTo(page: number): void {
    this.update({ page: page > 0 ? page : null });
  }

  protected clear(): void {
    this.searchText.set('');
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected open(id: string): void {
    this.router.navigate(['/app/submissions', id]);
  }

  protected money = usd;
  protected compact = usdCompact;
  protected date = shortDate;

  private update(queryParams: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
