import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../../shared/logo';

@Component({
  selector: 'rp-landing',
  imports: [RouterLink, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-dvh bg-deck-950 text-deck-100">
      <header class="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <rp-logo [dark]="true" />
        <a routerLink="/app/dashboard" class="btn-accent" data-testid="open-demo-top">Open demo</a>
      </header>

      <section
        class="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-16"
      >
        <div>
          <p
            class="mb-4 inline-flex items-center gap-2 rounded-full border border-deck-700 px-3 py-1 text-xs font-medium text-deck-300"
          >
            <span class="size-1.5 rounded-full bg-beacon-500"></span> Commercial P&amp;C · Portfolio
            demo
          </p>
          <h1 class="text-4xl leading-tight font-bold tracking-tight text-white sm:text-5xl">
            A co-pilot for underwriters.<br /><span class="text-beacon-400"
              >You stay in command.</span
            >
          </h1>
          <p class="mt-5 max-w-xl text-lg text-deck-300">
            RiskPilot reads the submission package, scores the risk, checks it against your appetite
            and suggests the next move — with every signal traced back to the document it came from.
            The underwriter makes the call, and every call is on the record.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a
              routerLink="/app/dashboard"
              class="btn-accent px-5 py-2.5 text-base"
              data-testid="open-demo"
              >Open demo</a
            >
            <a
              routerLink="/app/submissions"
              class="btn border border-deck-700 px-5 py-2.5 text-base text-white hover:bg-deck-900"
              >Browse submissions</a
            >
          </div>
          <p class="mt-4 text-sm text-deck-400">No sign-up. Runs on synthetic data.</p>
        </div>

        <!-- Product vignette built from real UI primitives (not a screenshot). -->
        <div
          class="rounded-2xl border border-deck-800 bg-deck-900 p-5 shadow-2xl shadow-black/40"
          aria-hidden="true"
        >
          <div class="mb-4 flex items-center justify-between">
            <div>
              <div class="text-xs text-deck-400">Sample submission · Commercial package</div>
              <div class="font-semibold text-white">Old Mill Logistics LLC</div>
            </div>
            <span
              class="rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300"
              >In review</span
            >
          </div>
          <div class="grid grid-cols-[auto_1fr] items-center gap-5 rounded-xl bg-deck-950/60 p-4">
            <div class="text-center">
              <div class="text-4xl font-bold text-white">48</div>
              <div class="text-xs text-deck-400">risk score</div>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2 text-emerald-300">
                <span class="size-2 rounded-full bg-emerald-400"></span>In appetite · Package –
                middle market
              </div>
              <div class="flex items-center gap-2 text-white">
                <span class="rounded bg-beacon-500 px-1.5 text-xs font-semibold text-deck-950"
                  >QUOTE</span
                >
                suggested next step
              </div>
            </div>
          </div>
          <ul class="mt-4 space-y-2 text-sm">
            @for (s of vignetteSignals; track s.label) {
              <li
                class="flex items-center justify-between gap-3 rounded-lg border border-deck-800 px-3 py-2"
              >
                <span class="text-deck-100">{{ s.label }}</span>
                <span class="shrink-0 font-mono text-xs text-deck-400">{{ s.source }}</span>
              </li>
            }
          </ul>
          <div class="mt-4 flex gap-2">
            <span class="btn flex-1 bg-white text-deck-900">Accept</span>
            <span class="btn flex-1 border border-deck-700 text-deck-200"
              >Override with reason</span
            >
          </div>
        </div>
      </section>

      <section class="border-t border-deck-900 bg-deck-900/40">
        <div class="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3">
          @for (f of features; track f.title) {
            <article class="rounded-xl border border-deck-800 bg-deck-950/50 p-6">
              <div
                class="mb-4 grid size-10 place-items-center rounded-lg bg-beacon-500/15 text-beacon-400"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="size-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path [attr.d]="f.icon" />
                </svg>
              </div>
              <h2 class="font-semibold text-white">{{ f.title }}</h2>
              <p class="mt-2 text-sm leading-relaxed text-deck-300">{{ f.body }}</p>
            </article>
          }
        </div>
      </section>

      <section class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 class="text-2xl font-bold text-white">From inbox to decision in four steps</h2>
        <ol class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          @for (step of steps; track step.title; let i = $index) {
            <li class="rounded-xl border border-deck-800 p-5">
              <div class="font-mono text-sm text-beacon-400">0{{ i + 1 }}</div>
              <div class="mt-2 font-semibold text-white">{{ step.title }}</div>
              <p class="mt-1 text-sm text-deck-400">{{ step.body }}</p>
            </li>
          }
        </ol>
        <div
          class="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl bg-beacon-500 p-8 text-deck-950 sm:flex-row sm:items-center"
        >
          <div>
            <div class="text-xl font-bold">See it on 40 synthetic submissions</div>
            <div class="text-sm text-deck-800">
              The demo runs entirely in your browser — nothing to install.
            </div>
          </div>
          <a
            routerLink="/app/dashboard"
            class="btn bg-deck-950 px-5 py-2.5 text-white hover:bg-deck-900"
            >Open demo</a
          >
        </div>
      </section>

      <footer class="border-t border-deck-900 px-4 py-8 text-center text-xs text-deck-500">
        RiskPilot is an independent portfolio project. All companies, brokers, people and figures
        are fictional.
      </footer>
    </div>
  `,
})
export class Landing {
  protected readonly vignetteSignals = [
    { label: 'Fully sprinklered (−8)', source: 'ACORD 140 · sprinklered' },
    { label: '2 losses in 5 years (+8)', source: 'Loss runs · loss_count_5y' },
    { label: 'Roof age 24 yrs (+8)', source: 'Inspection · roof_age_years' },
  ];

  protected readonly features = [
    {
      title: 'Signals with receipts',
      body: 'Every factor behind the score cites the document and the extracted field it came from, so you can check the evidence in one click instead of trusting a black box.',
      icon: 'M9 12l2 2 4-4M7 3h7l5 5v13H7z',
    },
    {
      title: 'Appetite built in',
      body: 'Your carrier rules — line, state, minimum construction class, TIV limits — are checked on every assessment. Out-of-appetite risks are never suggested for a quote.',
      icon: 'M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7z',
    },
    {
      title: 'Humans decide, on the record',
      body: 'Accept the suggestion or override it with a written reason. Each assessment, decision and rule change lands in an append-only audit log.',
      icon: 'M4 6h16M4 12h10M4 18h7M17 15l2 2 3-3',
    },
  ];

  protected readonly steps = [
    {
      title: 'Triage the inbox',
      body: 'Filter by status and line, search by applicant, broker or city.',
    },
    {
      title: 'Review the package',
      body: 'Applicant, property, loss history and documents on one screen.',
    },
    {
      title: 'Run the assessment',
      body: 'Score, appetite fit and a next best action with cited signals.',
    },
    { title: 'Decide', body: 'Accept or override with a reason. It is all audited.' },
  ];
}
