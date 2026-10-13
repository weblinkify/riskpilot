import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { mockApiInterceptor } from './mock-api.interceptor';
import { mockDb } from './mock-db';
import type { AppetiteRuleDto } from './mock-types';

describe('mock REST interceptor', () => {
  let http: HttpClient;

  beforeEach(() => {
    mockDb().reset();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([mockApiInterceptor]))],
    });
    http = TestBed.inject(HttpClient);
  });

  it('serves health', async () => {
    const health = await firstValueFrom(http.get<{ status: string }>('/api/health'));
    expect(health.status).toBe('UP');
  });

  it('supports appetite rule CRUD with validation and audit', async () => {
    const rules = await firstValueFrom(http.get<AppetiteRuleDto[]>('/api/appetite-rules'));
    expect(rules).toHaveLength(6);

    const created = await firstValueFrom(
      http.post<AppetiteRuleDto>('/api/appetite-rules', {
        name: 'Test',
        lineOfBusiness: 'UMBRELLA',
        state: 'TX',
        constructionClass: null,
        maxTiv: 1_000_000,
        active: true,
        notes: '',
      }),
    );
    expect(created.id).toBe(7);

    const updated = await firstValueFrom(
      http.put<AppetiteRuleDto>(`/api/appetite-rules/${created.id}`, {
        ...created,
        maxTiv: 2_000_000,
      }),
    );
    expect(updated.maxTiv).toBe(2_000_000);

    await expect(
      firstValueFrom(http.post('/api/appetite-rules', { name: '', maxTiv: -1 })),
    ).rejects.toMatchObject({ status: 400 });

    await firstValueFrom(http.delete(`/api/appetite-rules/${created.id}`));
    await expect(
      firstValueFrom(http.get(`/api/appetite-rules/${created.id}`)),
    ).rejects.toMatchObject({ status: 404 });
    expect(mockDb().state.audit.map((a) => a.action)).toEqual(
      expect.arrayContaining(['RULE_CREATED', 'RULE_UPDATED', 'RULE_DELETED']),
    );
  });

  it('lists and uploads documents', async () => {
    const docs = await firstValueFrom(
      http.get<{ type: string }[]>('/api/submissions/SUB-1001/documents'),
    );
    expect(docs[0].type).toBe('ACORD_125');
    const form = new FormData();
    form.append('file', new File(['abc'], 'loss_runs.pdf'));
    form.append('type', 'LOSS_RUNS');
    const doc = await firstValueFrom(
      http.post<{ fileName: string; sizeBytes: number }>(
        '/api/submissions/SUB-1001/documents',
        form,
      ),
    );
    expect(doc).toMatchObject({ fileName: 'loss_runs.pdf', sizeBytes: 3 });
  });
});
