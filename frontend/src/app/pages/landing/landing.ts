import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../../shared/logo';

@Component({
  selector: 'rp-landing',
  imports: [RouterLink, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.html',
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
