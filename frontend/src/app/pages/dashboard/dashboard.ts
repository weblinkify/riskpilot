import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { LINE_LABEL, STATUS_LABEL, dateTime, usdCompact } from '../../core/format';
import { BarChart, BarRow } from '../../shared/bar-chart';

@Component({
  selector: 'rp-dashboard',
  imports: [BarChart, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly api = inject(ApiService);
  protected readonly data = rxResource({ stream: () => this.api.dashboard() });
  protected readonly activity = rxResource({ stream: () => this.api.auditLog(8) });

  protected readonly open = computed(() =>
    (this.data.value()?.byStatus ?? [])
      .filter((s) => s.status === 'NEW' || s.status === 'IN_REVIEW')
      .reduce((a, s) => a + s.count, 0),
  );
  protected readonly days = computed(() =>
    ((this.data.value()?.avgHoursToDecision ?? 0) / 24).toFixed(1),
  );
  protected readonly statusRows = computed<BarRow[]>(() =>
    (this.data.value()?.byStatus ?? []).map((s) => ({
      label: STATUS_LABEL[s.status],
      value: s.count,
      display: String(s.count),
    })),
  );
  protected readonly lineCountRows = computed<BarRow[]>(() =>
    (this.data.value()?.byLine ?? []).map((l) => ({
      label: LINE_LABEL[l.lineOfBusiness],
      value: l.count,
      display: String(l.count),
    })),
  );
  protected readonly linePremiumRows = computed<BarRow[]>(() =>
    (this.data.value()?.byLine ?? []).map((l) => ({
      label: LINE_LABEL[l.lineOfBusiness],
      value: l.premium,
      display: usdCompact(l.premium),
    })),
  );

  protected pct(v: number): string {
    return `${Math.round(v * 100)}%`;
  }

  protected when(iso: string): string {
    return dateTime(iso);
  }
}
