import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'rp-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-2 font-semibold tracking-tight"
      [class]="dark() ? 'text-white' : 'text-deck-900'"
    >
      <svg viewBox="0 0 32 32" class="size-7" aria-hidden="true">
        <rect width="32" height="32" rx="8" [attr.fill]="dark() ? '#16304b' : '#0b1f33'" />
        <path d="M7 21.5 16 7l9 14.5-9-4.2z" fill="#f5a524" />
        <path d="M16 17.3 25 21.5 16 25l-9-3.5z" fill="#6d89ae" />
      </svg>
      <span class="text-lg">Risk<span class="text-beacon-500">Pilot</span></span>
    </span>
  `,
})
export class Logo {
  readonly dark = input(false);
}
