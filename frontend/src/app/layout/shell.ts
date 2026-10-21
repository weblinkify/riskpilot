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
  templateUrl: './shell.html',
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
