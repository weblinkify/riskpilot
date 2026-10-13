import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ApiService, errorMessage } from '../../core/api.service';
import { ACTIONS, ACTION_HINT, ACTION_LABEL, dateTime } from '../../core/format';
import { UNDERWRITER } from '../../core/session';
import type { AssessmentFieldsFragment, DecisionFieldsFragment } from '../../graphql/generated';
import type { RecommendedAction, SubmissionStatus } from '../../graphql/schema-types.generated';
import { RiskGauge } from '../../shared/risk-gauge';

/**
 * AI risk assessment + human-in-the-loop decision. The model only recommends; the underwriter
 * accepts or overrides (with a mandatory reason) and the backend audits both.
 */
@Component({
  selector: 'rp-assessment-panel',
  imports: [RiskGauge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card overflow-hidden" aria-labelledby="ai-title" data-testid="assessment-panel">
      <header
        class="flex items-center justify-between gap-3 border-b border-deck-100 bg-deck-900 px-5 py-3 text-white"
      >
        <h2 id="ai-title" class="flex items-center gap-2 text-sm font-semibold">
          <span class="grid size-6 place-items-center rounded-md bg-beacon-500 text-deck-950">
            <svg viewBox="0 0 24 24" class="size-3.5" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
            </svg>
          </span>
          AI risk assessment
        </h2>
        @if (assessment()) {
          <button
            type="button"
            class="text-xs font-medium text-deck-300 hover:text-white disabled:opacity-50"
            (click)="run()"
            [disabled]="running()"
            data-testid="rerun-assessment"
          >
            {{ running() ? 'Running…' : 'Re-run' }}
          </button>
        }
      </header>

      @if (error()) {
        <div
          class="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-800"
          role="alert"
          data-testid="panel-error"
        >
          {{ error() }}
        </div>
      }

      @if (assessment(); as a) {
        <div class="space-y-5 p-5" [class.opacity-50]="running()">
          <div class="grid grid-cols-[auto_1fr] items-center gap-4">
            <rp-risk-gauge [score]="a.riskScore" [band]="a.riskBand" />
            <div class="space-y-1 text-xs text-deck-500">
              <div>
                Confidence <span class="font-semibold text-deck-800">{{ pct(a.confidence) }}</span>
              </div>
              <div>
                Provider <span class="font-mono text-deck-700">{{ a.provider }}</span>
                @if (a.model) {
                  · {{ a.model }}
                }
              </div>
              <div>{{ when(a.createdAt) }}</div>
            </div>
          </div>
          <p class="text-sm leading-relaxed text-deck-700" data-testid="assessment-summary">
            {{ a.summary }}
          </p>

          <div
            class="rounded-lg border p-3"
            [class]="
              a.appetite.inAppetite
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-red-200 bg-red-50'
            "
            data-testid="appetite"
          >
            <div
              class="flex items-center gap-2 text-sm font-semibold"
              [class]="a.appetite.inAppetite ? 'text-emerald-800' : 'text-red-800'"
            >
              <span aria-hidden="true">{{ a.appetite.inAppetite ? '✓' : '✕' }}</span>
              {{ a.appetite.inAppetite ? 'In appetite' : 'Out of appetite' }}
            </div>
            @for (r of a.appetite.reasons; track r) {
              <p class="mt-1 text-xs text-deck-700">{{ r }}</p>
            }
          </div>

          <div class="rounded-lg border border-beacon-300 bg-beacon-300/15 p-3">
            <div class="text-xs font-semibold tracking-wide text-deck-600 uppercase">
              Next best action
            </div>
            <div class="mt-1 flex items-center gap-2">
              <span
                class="rounded-md bg-deck-900 px-2 py-0.5 text-sm font-semibold text-white"
                data-testid="recommended-action"
                >{{ actionLabel[a.recommendedAction] }}</span
              >
              <span class="text-xs text-deck-600">{{ actionHint[a.recommendedAction] }}</span>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-deck-700">{{ a.rationale }}</p>
          </div>

          <div>
            <h3 class="card-title mb-2">Signals &amp; evidence</h3>
            <ul class="space-y-2" data-testid="signals">
              @for (s of sortedSignals(); track s.code) {
                <li class="rounded-lg border border-deck-100 p-3" data-testid="signal">
                  <div class="flex items-start justify-between gap-2">
                    <span class="text-sm font-medium text-deck-900">{{ s.label }}</span>
                    <span
                      class="shrink-0 rounded px-1.5 py-0.5 font-mono text-xs font-semibold"
                      [class]="
                        s.points > 0
                          ? 'bg-red-50 text-red-700'
                          : s.points < 0
                            ? 'bg-emerald-50 text-good-ink'
                            : 'bg-deck-100 text-deck-600'
                      "
                      [attr.aria-label]="
                        s.points > 0
                          ? 'adds ' + s.points + ' points'
                          : s.points < 0
                            ? 'removes ' + -s.points + ' points'
                            : 'informational'
                      "
                    >
                      {{ s.points > 0 ? '+' + s.points : s.points === 0 ? 'info' : s.points }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-deck-600">{{ s.explanation }}</p>
                  <button
                    type="button"
                    class="mt-2 flex w-full items-start gap-1.5 rounded-md bg-deck-50 px-2 py-1.5 text-left font-mono text-[11px] leading-snug text-deck-600 hover:bg-deck-100 disabled:cursor-default disabled:hover:bg-deck-50"
                    [disabled]="!s.citation.documentId"
                    (click)="cite.emit(s.citation.documentId!)"
                    data-testid="citation"
                    [attr.title]="
                      s.citation.documentId ? 'Show source document' : 'No document on file'
                    "
                  >
                    <svg
                      viewBox="0 0 24 24"
                      class="mt-px size-3 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path d="M7 3h7l5 5v13H7z" />
                    </svg>
                    <span class="min-w-0 break-all"
                      ><span class="text-deck-800">{{ s.citation.documentName }}</span
                      ><br />{{ s.citation.field }} = {{ s.citation.value }}</span
                    >
                  </button>
                </li>
              }
            </ul>
          </div>

          <!-- Human in the loop -->
          <div class="border-t border-deck-100 pt-5" data-testid="decision-area">
            <h3 class="card-title mb-3">Your decision</h3>
            @if (status() === 'BOUND') {
              <p class="text-sm text-deck-600">
                This submission is bound. No further decisions can be recorded.
              </p>
            } @else if (decidedForThis(); as d) {
              <div class="rounded-lg bg-deck-50 p-3 text-sm" data-testid="decision-recorded">
                <span class="font-semibold"
                  >{{ d.outcome === 'ACCEPTED' ? 'Accepted' : 'Overridden' }}:</span
                >
                {{ actionLabel[d.finalAction] }} by {{ d.underwriter }}
                @if (d.reason) {
                  <p class="mt-1 text-xs text-deck-600">“{{ d.reason }}”</p>
                }
                <p class="mt-2 text-xs text-deck-500">
                  Re-run the assessment to record another decision.
                </p>
              </div>
            } @else if (!overriding()) {
              <div class="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  class="btn-primary flex-1"
                  (click)="decide(a.recommendedAction)"
                  [disabled]="saving()"
                  data-testid="accept"
                >
                  Accept · {{ actionLabel[a.recommendedAction] }}
                </button>
                <button
                  type="button"
                  class="btn-ghost flex-1"
                  (click)="startOverride(a.recommendedAction)"
                  [disabled]="saving()"
                  data-testid="override"
                >
                  Override…
                </button>
              </div>
              <p class="mt-2 text-xs text-deck-500">
                RiskPilot recommends; you decide. Both outcomes are written to the audit log.
              </p>
            } @else {
              <form
                class="space-y-3"
                (submit)="$event.preventDefault(); decide(overrideAction())"
                data-testid="override-form"
              >
                <fieldset>
                  <legend class="label">Your action</legend>
                  <div class="grid grid-cols-2 gap-2">
                    @for (act of otherActions(); track act) {
                      <label
                        class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                        [class]="
                          overrideAction() === act
                            ? 'border-deck-900 bg-deck-50 font-medium'
                            : 'border-deck-200'
                        "
                      >
                        <input
                          type="radio"
                          name="action"
                          class="accent-deck-900"
                          [value]="act"
                          [checked]="overrideAction() === act"
                          (change)="overrideAction.set(act)"
                          [attr.data-testid]="'override-action-' + act"
                        />
                        {{ actionLabel[act] }}
                      </label>
                    }
                  </div>
                </fieldset>
                <label class="block">
                  <span class="label">Reason for override <span class="text-red-600">*</span></span>
                  <textarea
                    class="input min-h-24"
                    maxlength="1000"
                    placeholder="e.g. Broker confirmed roof replaced in 2025; inspection to follow."
                    [value]="reason()"
                    (input)="reason.set($any($event.target).value)"
                    data-testid="override-reason"
                  ></textarea>
                  <span
                    class="mt-1 block text-xs"
                    [class]="reasonValid() ? 'text-deck-500' : 'text-red-700'"
                  >
                    {{
                      reasonValid()
                        ? 'Thanks — this goes on the record.'
                        : 'At least 10 characters (' + reasonLength() + '/10).'
                    }}
                  </span>
                </label>
                <div class="flex gap-2">
                  <button
                    type="submit"
                    class="btn-primary flex-1"
                    [disabled]="!reasonValid() || saving()"
                    data-testid="submit-override"
                  >
                    Record override
                  </button>
                  <button type="button" class="btn-ghost" (click)="overriding.set(false)">
                    Cancel
                  </button>
                </div>
              </form>
            }
          </div>
        </div>
      } @else {
        <div class="p-6 text-center">
          <p class="text-sm text-deck-600">
            No assessment yet. RiskPilot will score this submission, check it against your appetite
            rules and suggest a next step — citing the evidence for every signal.
          </p>
          <button
            type="button"
            class="btn-accent mt-4 w-full"
            (click)="run()"
            [disabled]="running()"
            data-testid="run-assessment"
          >
            @if (running()) {
              <span
                class="size-4 animate-spin rounded-full border-2 border-deck-950/30 border-t-deck-950"
                aria-hidden="true"
              ></span>
              Assessing…
            } @else {
              Run assessment
            }
          </button>
        </div>
      }
    </section>
  `,
})
export class AssessmentPanel {
  private readonly api = inject(ApiService);

  readonly submissionId = input.required<string>();
  readonly status = input.required<SubmissionStatus>();
  readonly assessment = input<AssessmentFieldsFragment | null>(null);
  readonly decisions = input<DecisionFieldsFragment[]>([]);
  readonly changed = output<void>();
  readonly cite = output<string>();

  protected readonly running = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly overriding = signal(false);
  protected readonly overrideAction = signal<RecommendedAction>('QUOTE');
  protected readonly reason = signal('');
  protected readonly reasonLength = computed(() => this.reason().trim().length);
  protected readonly reasonValid = computed(() => this.reasonLength() >= 10);

  protected readonly actionLabel = ACTION_LABEL;
  protected readonly actionHint = ACTION_HINT;

  protected readonly sortedSignals = computed(() =>
    [...(this.assessment()?.signals ?? [])].sort((a, b) => b.points - a.points),
  );
  protected readonly otherActions = computed(() =>
    ACTIONS.filter((a) => a !== this.assessment()?.recommendedAction),
  );
  protected readonly decidedForThis = computed(() => {
    const id = this.assessment()?.id;
    return id ? (this.decisions().find((d) => d.assessmentId === id) ?? null) : null;
  });

  protected run(): void {
    this.running.set(true);
    this.error.set(null);
    this.api.runAssessment(this.submissionId()).subscribe({
      next: () => {
        this.running.set(false);
        this.overriding.set(false);
        this.changed.emit();
      },
      error: (e) => {
        this.running.set(false);
        this.error.set(errorMessage(e));
      },
    });
  }

  protected startOverride(recommended: RecommendedAction): void {
    this.overrideAction.set(ACTIONS.find((a) => a !== recommended)!);
    this.reason.set('');
    this.overriding.set(true);
  }

  protected decide(finalAction: RecommendedAction): void {
    const a = this.assessment();
    if (!a) return;
    this.saving.set(true);
    this.error.set(null);
    this.api
      .recordDecision({
        submissionId: this.submissionId(),
        assessmentId: a.id,
        finalAction,
        reason: finalAction === a.recommendedAction ? null : this.reason().trim(),
        underwriter: UNDERWRITER,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.overriding.set(false);
          this.changed.emit();
        },
        error: (e) => {
          this.saving.set(false);
          this.error.set(errorMessage(e));
        },
      });
  }

  protected pct(v: number): string {
    return `${Math.round(v * 100)}%`;
  }

  protected when(iso: string): string {
    return dateTime(iso);
  }
}
