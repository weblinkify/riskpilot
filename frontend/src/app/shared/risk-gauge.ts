import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { RiskBand } from '../graphql/schema-types.generated';
import { BAND_LABEL } from '../core/format';

/** Status colours (good / warning / serious / critical) – always shown together with a text label. */
const BAND_COLOR: Record<RiskBand, string> = {
  LOW: 'var(--color-good)',
  MODERATE: 'var(--color-warning)',
  ELEVATED: 'var(--color-serious)',
  HIGH: 'var(--color-critical)',
};

/** Semicircular 0–100 meter. Arc length is proportional to the score. */
@Component({
  selector: 'rp-risk-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure
      class="flex flex-col items-center"
      role="meter"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="score()"
      [attr.aria-label]="'Risk score ' + score() + ' of 100, ' + label()"
    >
      <svg viewBox="0 0 120 68" class="w-44">
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          stroke="var(--color-deck-100)"
          stroke-width="10"
          stroke-linecap="round"
        />
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          [attr.stroke]="color()"
          stroke-width="10"
          stroke-linecap="round"
          pathLength="100"
          [attr.stroke-dasharray]="score() + ' 100'"
        />
        <text
          x="60"
          y="52"
          text-anchor="middle"
          class="fill-deck-900"
          style="font: 700 26px var(--font-sans)"
          data-testid="risk-score"
        >
          {{ score() }}
        </text>
        <text
          x="60"
          y="66"
          text-anchor="middle"
          class="fill-deck-400"
          style="font: 500 8px var(--font-sans)"
        >
          of 100
        </text>
      </svg>
      <figcaption
        class="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-deck-800"
        data-testid="risk-band"
      >
        <span class="size-2.5 rounded-full" [style.background]="color()"></span>{{ label() }}
      </figcaption>
    </figure>
  `,
})
export class RiskGauge {
  readonly score = input.required<number>();
  readonly band = input.required<RiskBand>();
  protected readonly color = computed(() => BAND_COLOR[this.band()]);
  protected readonly label = computed(() => BAND_LABEL[this.band()]);
}
