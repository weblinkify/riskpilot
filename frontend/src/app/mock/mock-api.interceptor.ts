import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { mockDb } from './mock-db';
import type { AppetiteRuleDto } from './mock-types';

const LINES = ['PROPERTY', 'COMMERCIAL_PACKAGE', 'GENERAL_LIABILITY', 'UMBRELLA'];
const CONSTRUCTION = [
  'FRAME',
  'JOISTED_MASONRY',
  'NON_COMBUSTIBLE',
  'MASONRY_NON_COMBUSTIBLE',
  'MODIFIED_FIRE_RESISTIVE',
  'FIRE_RESISTIVE',
];
const DOC_TYPES = [
  'ACORD_125',
  'ACORD_140',
  'SOV',
  'LOSS_RUNS',
  'INSPECTION_REPORT',
  'FINANCIAL_STATEMENT',
  'OTHER',
];

const ok = <T>(body: T, status = 200): Observable<HttpEvent<T>> =>
  of(new HttpResponse({ status, body })).pipe(delay(60));
const problem = (url: string, status: number, detail: string): Observable<never> =>
  throwError(
    () => new HttpErrorResponse({ url, status, statusText: detail, error: { status, detail } }),
  );

function validateRule(body: Partial<AppetiteRuleDto>): string | null {
  const errors: string[] = [];
  if (!body.name?.trim()) errors.push('name must not be blank');
  if (!body.lineOfBusiness || !LINES.includes(body.lineOfBusiness))
    errors.push('lineOfBusiness must not be null');
  if (body.state && !/^[A-Z]{2}$/.test(body.state))
    errors.push('state must be a two-letter state code');
  if (body.constructionClass && !CONSTRUCTION.includes(body.constructionClass))
    errors.push('constructionClass is invalid');
  if (typeof body.maxTiv !== 'number' || !(body.maxTiv > 0))
    errors.push('maxTiv must be greater than 0');
  return errors.length ? errors.join('; ') : null;
}

function describe(r: AppetiteRuleDto): string {
  return `${r.name} [${r.lineOfBusiness}, ${r.state ?? 'any state'}, min ${r.constructionClass ?? 'any'}, max TIV ${r.maxTiv}, ${r.active ? 'active' : 'inactive'}]`;
}

/**
 * API_MODE=mock: answers the REST endpoints of the Java backend in the browser
 * (/api/health, /api/appetite-rules CRUD, /api/submissions/{id}/documents).
 */
export const mockApiInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next) => {
  const path = new URL(req.url, 'http://mock.local').pathname;
  if (!path.startsWith('/api/')) return next(req);
  const db = mockDb();
  const state = db.state;

  if (path === '/api/health' && req.method === 'GET') {
    return ok({ status: 'UP', database: 'IN_BROWSER', assessmentProvider: 'mock-rules-v1' });
  }

  if (path === '/api/appetite-rules') {
    if (req.method === 'GET') return ok([...state.rules].sort((a, b) => a.id - b.id));
    if (req.method === 'POST') {
      const body = req.body as Partial<AppetiteRuleDto>;
      const error = validateRule(body);
      if (error) return problem(req.url, 400, error);
      const rule: AppetiteRuleDto = {
        id: Math.max(0, ...state.rules.map((r) => r.id)) + 1,
        name: body.name!.trim(),
        lineOfBusiness: body.lineOfBusiness!,
        state: body.state || null,
        constructionClass: body.constructionClass ?? null,
        maxTiv: body.maxTiv!,
        active: !!body.active,
        notes: body.notes?.trim() ?? '',
      };
      state.rules.push(rule);
      db.audit('APPETITE_RULE', String(rule.id), 'RULE_CREATED', 'admin', describe(rule));
      db.save();
      return ok(rule, 201);
    }
  }

  const ruleMatch = path.match(/^\/api\/appetite-rules\/(\d+)$/);
  if (ruleMatch) {
    const id = Number(ruleMatch[1]);
    const rule = state.rules.find((r) => r.id === id);
    if (!rule) return problem(req.url, 404, `Rule ${id} not found`);
    if (req.method === 'GET') return ok(rule);
    if (req.method === 'PUT') {
      const body = req.body as Partial<AppetiteRuleDto>;
      const error = validateRule(body);
      if (error) return problem(req.url, 400, error);
      const before = describe(rule);
      Object.assign(rule, {
        name: body.name!.trim(),
        lineOfBusiness: body.lineOfBusiness,
        state: body.state || null,
        constructionClass: body.constructionClass ?? null,
        maxTiv: body.maxTiv,
        active: !!body.active,
        notes: body.notes?.trim() ?? '',
      });
      db.audit(
        'APPETITE_RULE',
        String(id),
        'RULE_UPDATED',
        'admin',
        `${before} → ${describe(rule)}`,
      );
      db.save();
      return ok(rule);
    }
    if (req.method === 'DELETE') {
      state.rules = state.rules.filter((r) => r.id !== id);
      db.audit('APPETITE_RULE', String(id), 'RULE_DELETED', 'admin', describe(rule));
      db.save();
      return ok(null, 204);
    }
  }

  const docMatch = path.match(/^\/api\/submissions\/([^/]+)\/documents$/);
  if (docMatch) {
    const submission = db.submission(decodeURIComponent(docMatch[1]));
    if (!submission) return problem(req.url, 404, `Submission ${docMatch[1]} not found`);
    if (req.method === 'GET')
      return ok(submission.documents.map((d) => ({ ...d, submissionId: submission.id })));
    if (req.method === 'POST') {
      const form = req.body as FormData;
      const file = form.get('file') as File | null;
      const type = (form.get('type') as string | null) ?? 'OTHER';
      if (!file || file.size === 0) return problem(req.url, 400, 'File is empty.');
      if (!DOC_TYPES.includes(type)) return problem(req.url, 400, `Unknown document type ${type}`);
      const doc = {
        id: `${submission.id}-U${submission.documents.length + 1}`,
        submissionId: submission.id,
        fileName: file.name,
        type,
        sizeBytes: file.size,
        pageCount: 1,
        uploadedAt: new Date().toISOString(),
        extractedFields: [],
      };
      submission.documents.push(doc);
      db.audit(
        'SUBMISSION',
        submission.id,
        'DOCUMENT_UPLOADED',
        'underwriter',
        `${file.name} (${type})`,
      );
      db.save();
      return ok(doc, 201);
    }
  }
  return problem(req.url, 404, `No mock handler for ${req.method} ${path}`);
};
