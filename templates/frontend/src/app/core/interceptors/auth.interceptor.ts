import { Injectable, Injector } from '@angular/core';
import { 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpInterceptor, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  
  constructor(
    private injector: Injector,
    private router: Router
  ) {}

  // Get AuthService lazily to avoid circular dependency
  private get authService(): AuthService {
    return this.injector.get(AuthService);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip adding token for refresh token requests
    if (this.isRefreshTokenRequest(request)) {
      return next.handle(request);
    }
    
    // Add auth token to request if available
    const authToken = this.authService.getAuthToken();
    
    if (authToken) {
      request = this.addToken(request, authToken);
    }
    
    // Continue with modified request
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Try to refresh token if not already refreshing
          return this.handle401Error(request, next);
        } else if (error.status === 403) {
          // Handle 403 Forbidden errors
          this.router.navigate(['/unauthorized']);
        }
        
        // Re-throw the error for further handling
        return throwError(() => error);
      })
    );
  }

  //FIXME: 
  private isRefreshTokenRequest(request: HttpRequest<any>): boolean {
    return request.url.includes('/auth/refresh');
  }
  
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      
      return this.authService.refreshToken().pipe(
        switchMap(response => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.accessToken);
          return next.handle(this.addToken(request, response.accessToken));
        }),
        catchError(error => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => error);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      // Wait for token to be refreshed
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }
  
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    // Don't add token for requests to external domains
    const isApiUrl = request.url.startsWith(this.getBaseUrl());
    
    if (!isApiUrl) {
      return request;
    }
    
    // Clone the request and add Authorization header
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
  }
  
  private getBaseUrl(): string {
    const apiUrlParts = this.authService['BASE_URL'].split('/');
    return apiUrlParts[0] + '//' + apiUrlParts[2]; // protocol + host
  }
} 