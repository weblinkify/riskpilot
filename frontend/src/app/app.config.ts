import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideApollo } from 'apollo-angular';
import { routes } from './app.routes';
import { apolloOptions } from './core/apollo';
import { lazyMockRestInterceptor } from './core/mock-rest.interceptor';
import { runtimeConfig } from './core/runtime-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(
      withInterceptors(runtimeConfig.apiMode === 'mock' ? [lazyMockRestInterceptor] : []),
    ),
    provideApollo(apolloOptions),
  ],
};
