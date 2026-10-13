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
  template: `
    <a
      routerLink="/app/submissions"
      class="mb-4 inline-flex items-center gap-1 text-sm text-deck-500 hover:text-deck-900"
      >← All submissions</a
    >

    @if (detail.error()) {
      <div class="card p-6 text-sm text-red-700" role="alert">
        Could not load this submission. {{ detail.error()?.message }}
      </div>
    } @else if (detail.hasValue() && !submission()) {
      <div class="card p-6 text-sm" data-testid="not-found">
        Submission {{ id() }} was not found.
      </div>
    } @else if (submission(); as s) {
      <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="font-mono text-xs text-deck-500">
            {{ s.reference }} · {{ lineLabel[s.lineOfBusiness] }}
          </div>
          <h1 class="mt-1 text-2xl font-bold tracking-tight" data-testid="applicant-name">
            {{ s.applicant.name }}
          </h1>
          <p class="text-sm text-deck-500">
            {{ s.property.occupancy }} · {{ s.applicant.city }}, {{ s.applicant.state }}
          </p>
        </div>
        <div class="flex flex-col items-end gap-1 text-right">
          <rp-status-badge [status]="s.status" />
          <span class="text-xs text-deck-500"
            >Received {{ date(s.receivedAt) }} · Requested premium {{ money(s.premium) }}</span
          >
        </div>
      </header>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div class="min-w-0 space-y-6">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section class="card p-5">
              <h2 class="card-title mb-3">Applicant</h2>
              <dl
                class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm [&_dd]:break-words [&_dt]:whitespace-nowrap"
              >
                <dt class="text-deck-500">Industry</dt>
                <dd>{{ s.applicant.industry }}</dd>
                <dt class="text-deck-500">In business</dt>
                <dd>{{ s.applicant.yearsInBusiness }} years</dd>
                <dt class="text-deck-500">Revenue</dt>
                <dd>{{ money(s.applicant.annualRevenue) }}</dd>
                <dt class="text-deck-500">Address</dt>
                <dd>
                  {{ s.applicant.street }}, {{ s.applicant.city }}, {{ s.applicant.state }}
                  {{ s.applicant.zip }}
                </dd>
                <dt class="text-deck-500">Broker</dt>
                <dd>
                  {{ s.broker.name
                  }}<span class="block text-xs text-deck-500"
                    >{{ s.broker.agency }} · {{ s.broker.email }}</span
                  >
                </dd>
              </dl>
            </section>
            <section class="card p-5" data-testid="property-details">
              <h2 class="card-title mb-3">Property</h2>
              <dl
                class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm [&_dd]:break-words [&_dt]:whitespace-nowrap"
              >
                <dt class="text-deck-500">TIV</dt>
                <dd class="font-semibold">{{ money(s.property.tiv) }}</dd>
                <dt class="text-deck-500">Construction</dt>
                <dd>{{ constructionLabel[s.property.constructionClass] }}</dd>
                <dt class="text-deck-500">Occupancy</dt>
                <dd>{{ s.property.occupancy }}</dd>
                <dt class="text-deck-500">Built / size</dt>
                <dd>
                  {{ s.property.yearBuilt }} · {{ s.property.stories }}
                  {{ s.property.stories === 1 ? 'story' : 'stories' }} ·
                  {{ s.property.squareFeet.toLocaleString('en-US') }} sq ft
                </dd>
                <dt class="text-deck-500">Protection</dt>
                <dd>
                  {{ s.property.sprinklered ? 'Sprinklered' : 'Not sprinklered' }} · ISO PC
                  {{ s.property.protectionClass }}
                </dd>
                <dt class="text-deck-500">Exposure</dt>
                <dd>
                  Flood zone {{ s.property.floodZone }} · {{ s.property.distanceToCoastMiles }} mi
                  to coast
                </dd>
                @if (s.property.roofAgeYears !== null) {
                  <dt class="text-deck-500">Roof</dt>
                  <dd>
                    {{ s.property.roofAgeYears }} yrs · {{ s.property.openRecommendations }} open
                    recs
                  </dd>
                }
              </dl>
            </section>
          </div>

          <section class="card overflow-hidden" data-testid="loss-history">
            <h2 class="card-title px-5 pt-5">Loss history (5 years)</h2>
            @if (s.losses.length) {
              <div class="mt-3 overflow-x-auto">
                <table class="w-full min-w-[40rem]">
                  <thead class="border-y border-deck-100 bg-deck-50/60">
                    <tr>
                      <th class="table-head">Date</th>
                      <th class="table-head">Cause</th>
                      <th class="table-head">Description</th>
                      <th class="table-head text-right">Paid</th>
                      <th class="table-head text-right">Reserved</th>
                      <th class="table-head">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-deck-100">
                    @for (l of s.losses; track l.id) {
                      <tr>
                        <td class="table-cell whitespace-nowrap">{{ date(l.lossDate) }}</td>
                        <td class="table-cell whitespace-nowrap">{{ humanize(l.cause) }}</td>
                        <td class="table-cell text-deck-600">{{ l.description }}</td>
                        <td class="table-cell text-right tabular-nums">
                          {{ money(l.amountPaid) }}
                        </td>
                        <td class="table-cell text-right tabular-nums">
                          {{ money(l.amountReserved) }}
                        </td>
                        <td class="table-cell">
                          <span
                            class="text-xs font-medium"
                            [class]="l.status === 'OPEN' ? 'text-red-700' : 'text-deck-500'"
                            >{{ l.status === 'OPEN' ? 'Open' : 'Closed' }}</span
                          >
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot class="border-t border-deck-200 font-semibold">
                    <tr>
                      <td class="table-cell" colspan="3">Total incurred</td>
                      <td class="table-cell text-right tabular-nums" colspan="2">
                        {{ money(totalIncurred()) }}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            } @else {
              <p class="px-5 pt-2 pb-5 text-sm text-deck-500">
                {{
                  hasLossRuns()
                    ? 'Loss-free: loss runs show no claims in the last five years.'
                    : 'No loss runs on file.'
                }}
              </p>
            }
          </section>

          <section class="card p-5" data-testid="documents">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 class="card-title">Documents ({{ s.documents.length }})</h2>
              <form
                class="flex flex-wrap items-center gap-2"
                (submit)="$event.preventDefault(); upload(fileInput)"
              >
                <select
                  class="input w-auto py-1.5 text-xs"
                  [value]="uploadType()"
                  (change)="uploadType.set($any($event.target).value)"
                  aria-label="Document type"
                >
                  @for (t of docTypes; track t) {
                    <option [value]="t">{{ docTypeLabel[t] }}</option>
                  }
                </select>
                <input
                  #fileInput
                  type="file"
                  class="max-w-48 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-deck-100 file:px-2 file:py-1.5 file:text-xs"
                  aria-label="Choose file"
                  data-testid="file-input"
                />
                <button
                  type="submit"
                  class="btn-ghost py-1.5 text-xs"
                  [disabled]="uploading()"
                  data-testid="upload"
                >
                  {{ uploading() ? 'Uploading…' : 'Upload' }}
                </button>
              </form>
            </div>
            @if (uploadError()) {
              <p class="mb-2 text-sm text-red-700" role="alert">{{ uploadError() }}</p>
            }
            <ul class="divide-y divide-deck-100 rounded-lg border border-deck-100">
              @for (d of s.documents; track d.id) {
                <li
                  [id]="'doc-' + d.id"
                  class="transition-colors"
                  [class.bg-beacon-300/20]="highlighted() === d.id"
                  data-testid="document"
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-deck-50/60"
                    (click)="toggleDoc(d.id)"
                    [attr.aria-expanded]="expanded().has(d.id)"
                  >
                    <span
                      class="grid size-9 shrink-0 place-items-center rounded-lg bg-deck-100 font-mono text-[10px] font-semibold text-deck-600"
                      >{{ ext(d.fileName) }}</span
                    >
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-medium">{{ d.fileName }}</span>
                      <span class="block text-xs text-deck-500"
                        >{{ docTypeLabel[d.type] ?? d.type }} · {{ d.pageCount }} p ·
                        {{ size(d.sizeBytes) }} · {{ when(d.uploadedAt) }}</span
                      >
                    </span>
                    <span class="text-xs text-deck-400"
                      >{{ d.extractedFields.length }} fields
                      {{ expanded().has(d.id) ? '▴' : '▾' }}</span
                    >
                  </button>
                  @if (expanded().has(d.id)) {
                    @if (d.extractedFields.length) {
                      <dl
                        class="grid grid-cols-1 gap-x-6 gap-y-1 px-4 pb-4 pl-16 text-xs sm:grid-cols-2"
                      >
                        @for (f of d.extractedFields; track f.key) {
                          <div
                            class="flex justify-between gap-3 border-b border-dashed border-deck-100 py-1"
                          >
                            <dt class="text-deck-500">
                              {{ f.label }} <span class="font-mono text-deck-400">{{ f.key }}</span>
                            </dt>
                            <dd class="text-right font-medium">{{ f.value }}</dd>
                          </div>
                        }
                      </dl>
                    } @else {
                      <p class="px-4 pb-4 pl-16 text-xs text-deck-500">
                        Field extraction is not part of the MVP for uploaded files.
                      </p>
                    }
                  }
                </li>
              }
            </ul>
          </section>

          <section class="card p-5" data-testid="history">
            <h2 class="card-title mb-3">Decisions &amp; audit trail</h2>
            <ol class="relative space-y-3 border-l border-deck-200 pl-5">
              @for (e of audit(); track e.id) {
                <li class="text-sm">
                  <span
                    class="absolute -left-[5px] mt-1.5 size-2.5 rounded-full border-2 border-white"
                    [class]="dot(e.action)"
                  ></span>
                  <div class="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span class="font-mono text-xs font-semibold text-deck-700">{{
                      e.action
                    }}</span>
                    <span class="text-xs text-deck-400"
                      >{{ e.actor }} · {{ when(e.createdAt) }}</span
                    >
                  </div>
                  <p class="text-deck-600">{{ e.details }}</p>
                </li>
              } @empty {
                <li class="text-sm text-deck-500">No activity yet.</li>
              }
            </ol>
          </section>
        </div>

        <aside class="xl:sticky xl:top-6 xl:self-start">
          <rp-assessment-panel
            [submissionId]="s.id"
            [status]="s.status"
            [assessment]="s.latestAssessment"
            [decisions]="s.decisions"
            (changed)="detail.reload()"
            (cite)="showDocument($event)"
          />
        </aside>
      </div>
    } @else {
      <div class="space-y-4" aria-busy="true">
        <div class="card h-24 animate-pulse"></div>
        <div class="card h-64 animate-pulse"></div>
      </div>
    }
  `,
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
