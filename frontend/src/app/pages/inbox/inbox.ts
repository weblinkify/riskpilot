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
  templateUrl: './inbox.html',
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
