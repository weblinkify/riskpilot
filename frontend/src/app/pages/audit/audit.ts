import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { dateTime } from '../../core/format';

@Component({
  selector: 'rp-audit',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './audit.html',
})
export class Audit {
  private readonly api = inject(ApiService);
  protected readonly log = rxResource({ stream: () => this.api.auditLog(200) });
  protected readonly when = dateTime;
}
