import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';

/** Lazy wrapper so the REST mock (and its seed data) is only downloaded in mock mode. */
export const lazyMockRestInterceptor: HttpInterceptorFn = (req, next) =>
  from(import('../mock/mock-api.interceptor')).pipe(
    switchMap((m) => m.mockApiInterceptor(req, next)),
  );
