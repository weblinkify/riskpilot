import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { dateTime } from '../../core/format';

@Component({
  selector: 'rp-audit',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-5">
      <h1 class="text-2xl font-bold tracking-tight">Audit log</h1>
      <p class="text-sm text-deck-500">
        Append-only record of assessments, decisions, overrides, uploads and rule changes.
      </p>
    </header>
    <div class="card overflow-hidden">
      <div class="relative overflow-x-auto">
        <table class="w-full min-w-[48rem]">
          <thead class="border-b border-deck-100 bg-deck-50/60">
            <tr>
              <th class="table-head">When</th>
              <th class="table-head">Action</th>
              <th class="table-head">Entity</th>
              <th class="table-head">Actor</th>
              <th class="table-head">Details</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-deck-100">
            @for (e of log.value() ?? []; track e.id) {
              <tr data-testid="audit-row">
                <td class="table-cell whitespace-nowrap text-deck-500">{{ when(e.createdAt) }}</td>
                <td class="table-cell font-mono text-xs font-semibold">{{ e.action }}</td>
                <td class="table-cell whitespace-nowrap">
                  @if (e.entityType === 'SUBMISSION') {
                    <a class="hover:underline" [routerLink]="['/app/submissions', e.entityId]">{{
                      e.entityId
                    }}</a>
                  } @else {
                    Rule {{ e.entityId }}
                  }
                </td>
                <td class="table-cell whitespace-nowrap">{{ e.actor }}</td>
                <td class="table-cell text-deck-600">{{ e.details }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class Audit {
  private readonly api = inject(ApiService);
  protected readonly log = rxResource({ stream: () => this.api.auditLog(200) });
  protected readonly when = dateTime;
}
