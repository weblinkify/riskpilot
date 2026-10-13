import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Logo } from '../shared/logo';
import { runtimeConfig } from '../core/runtime-config';
import { UNDERWRITER } from '../core/session';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'rp-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:bg-[linear-gradient(to_right,var(--color-deck-900)_15rem,transparent_15rem)]"
    >
      <aside class="bg-deck-900 text-deck-200 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div class="flex items-center justify-between px-4 py-3 lg:px-5 lg:py-5">
          <a routerLink="/" aria-label="RiskPilot home"><rp-logo [dark]="true" /></a>
          <span
            class="rounded-full px-2 py-0.5 text-[11px] font-semibold lg:hidden"
            [class]="modeClass"
            >{{ modeLabel }}</span
          >
        </div>
        <nav
          aria-label="Main"
          class="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0"
        >
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="!bg-deck-800 !text-white"
              [attr.data-testid]="'nav-' + item.path"
              class="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-deck-300 hover:bg-deck-800/60 hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                class="size-4.5 shrink-0"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path [attr.d]="item.icon" />
              </svg>
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="mt-auto hidden space-y-3 border-t border-deck-800 p-5 lg:block">
          <div class="flex items-center gap-3">
            <div
              class="grid size-8 place-items-center rounded-full bg-beacon-500 text-xs font-bold text-deck-950"
            >
              DU
            </div>
            <div class="text-sm leading-tight">
              <div class="font-medium text-white">{{ underwriter }}</div>
              <div class="text-xs text-deck-400">Commercial P&amp;C</div>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs" data-testid="api-mode">
            <span class="rounded-full px-2 py-0.5 font-semibold" [class]="modeClass">{{
              modeLabel
            }}</span>
            <span class="text-deck-400">{{ modeHint }}</span>
          </div>
        </div>
      </aside>
      <main class="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell {
  protected readonly underwriter = UNDERWRITER;
  protected readonly mock = runtimeConfig.apiMode === 'mock';
  protected readonly modeLabel = this.mock ? 'Mock API' : 'Live API';
  protected readonly modeHint = this.mock ? 'in-browser data' : 'Java + PostgreSQL';
  protected readonly modeClass = this.mock
    ? 'bg-beacon-500/15 text-beacon-300'
    : 'bg-emerald-400/15 text-emerald-300';
  protected readonly nav: NavItem[] = [
    {
      path: 'dashboard',
      label: 'Dashboard',
      icon: 'M4 13h6V4H4zm10 7h6V11h-6zM4 20h6v-4H4zm10-12h6V4h-6z',
    },
    { path: 'submissions', label: 'Submissions', icon: 'M4 6h16M4 12h16M4 18h10' },
    {
      path: 'appetite-rules',
      label: 'Appetite rules',
      icon: 'M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7z',
    },
    {
      path: 'audit',
      label: 'Audit log',
      icon: 'M9 5h10M9 12h10M9 19h10M5 5h.01M5 12h.01M5 19h.01',
    },
  ];
}
