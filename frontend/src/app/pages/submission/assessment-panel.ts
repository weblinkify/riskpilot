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
  templateUrl: './assessment-panel.html',
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
