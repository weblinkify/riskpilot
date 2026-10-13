import { TestBed } from '@angular/core/testing';
import { RiskGauge } from './risk-gauge';
import { StatusBadge } from './status-badge';
import { BarChart } from './bar-chart';

describe('shared components', () => {
  it('StatusBadge renders a human label', async () => {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', 'IN_REVIEW');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('In review');
  });

  it('RiskGauge exposes score and band accessibly', async () => {
    const fixture = TestBed.createComponent(RiskGauge);
    fixture.componentRef.setInput('score', 72);
    fixture.componentRef.setInput('band', 'HIGH');
    await fixture.whenStable();
    const meter = (fixture.nativeElement as HTMLElement).querySelector('[role="meter"]')!;
    expect(meter.getAttribute('aria-valuenow')).toBe('72');
    expect(meter.getAttribute('aria-label')).toContain('High risk');
  });

  it('BarChart switches to a table view', async () => {
    const fixture = TestBed.createComponent(BarChart);
    fixture.componentRef.setInput('title', 'By status');
    fixture.componentRef.setInput('rows', [
      { label: 'New', value: 4, display: '4' },
      { label: 'Bound', value: 2, display: '2' },
    ]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('li')).toHaveLength(2);
    el.querySelector('button')!.click();
    await fixture.whenStable();
    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
  });
});
