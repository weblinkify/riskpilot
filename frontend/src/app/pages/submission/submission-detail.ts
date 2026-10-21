import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api.service';
import {
  ACTION_LABEL,
  CONSTRUCTION_LABEL,
  DOC_TYPE_LABEL,
  LINE_LABEL,
  dateTime,
  fileSize,
  shortDate,
  usd,
} from '../../core/format';
import { StatusBadge } from '../../shared/status-badge';
import { AssessmentPanel } from './assessment-panel';

@Component({
  selector: 'rp-submission-detail',
  imports: [RouterLink, StatusBadge, AssessmentPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './submission-detail.html',
})
export class SubmissionDetail {
  private readonly api = inject(ApiService);
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Bound from the `:id` route param. */
  readonly id = input.required<string>();

  protected readonly detail = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.api.submission(params),
  });
  protected readonly submission = computed(() => this.detail.value()?.submission ?? null);
  protected readonly audit = computed(() => this.detail.value()?.auditLog ?? []);
  protected readonly totalIncurred = computed(() =>
    (this.submission()?.losses ?? []).reduce((s, l) => s + l.amountPaid + l.amountReserved, 0),
  );
  protected readonly hasLossRuns = computed(
    () => !!this.submission()?.documents.some((d) => d.type === 'LOSS_RUNS'),
  );

  protected readonly expanded = signal<Set<string>>(new Set());
  protected readonly highlighted = signal<string | null>(null);
  protected readonly uploadType = signal('LOSS_RUNS');
  protected readonly uploading = signal(false);
  protected readonly uploadError = signal<string | null>(null);

  protected readonly lineLabel = LINE_LABEL;
  protected readonly constructionLabel = CONSTRUCTION_LABEL;
  protected readonly docTypeLabel = DOC_TYPE_LABEL;
  protected readonly docTypes = Object.keys(DOC_TYPE_LABEL);
  protected readonly actionLabel = ACTION_LABEL;
  protected readonly money = usd;
  protected readonly date = shortDate;
  protected readonly when = dateTime;
  protected readonly size = fileSize;

  protected toggleDoc(id: string): void {
    const next = new Set(this.expanded());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.expanded.set(next);
  }

  /** Citation click: open the cited document and bring it into view. */
  protected showDocument(id: string): void {
    this.expanded.set(new Set(this.expanded()).add(id));
    this.highlighted.set(id);
    queueMicrotask(() =>
      (this.host.nativeElement as HTMLElement)
        .querySelector(`#doc-${CSS.escape(id)}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
    setTimeout(() => this.highlighted.set(null), 2500);
  }

  protected upload(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) {
      this.uploadError.set('Choose a file first.');
      return;
    }
    this.uploading.set(true);
    this.uploadError.set(null);
    this.api.uploadDocument(this.id(), file, this.uploadType()).subscribe({
      next: () => {
        this.uploading.set(false);
        input.value = '';
        this.detail.reload();
      },
      error: (e) => {
        this.uploading.set(false);
        this.uploadError.set(errorMessage(e));
      },
    });
  }

  protected ext(name: string): string {
    return (name.split('.').pop() ?? 'doc').toUpperCase().slice(0, 4);
  }

  protected humanize(code: string): string {
    return code.charAt(0) + code.slice(1).toLowerCase().replaceAll('_', ' ');
  }

  protected dot(action: string): string {
    if (action.includes('OVERRIDDEN')) return 'bg-beacon-500';
    if (action.includes('ACCEPTED') || action.includes('RECORDED')) return 'bg-emerald-500';
    if (action.includes('ASSESSMENT')) return 'bg-series-1';
    return 'bg-deck-400';
  }
}
