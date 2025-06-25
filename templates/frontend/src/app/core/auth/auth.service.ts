import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginPayload,
  AuthResponse,
  TokenData,
} from 'src/app/shared/models/auth.model';
import { User } from '../../shared/models/user.model';
import { ValidationData } from './auth.type';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private readonly BASE_URL = environment.apiUrl;
  private tokenRefreshTimeout: any;

  public validationData: ValidationData = {
    otpId: '',
    isEmail: false,
    expiryTime: 60,
    otpValidation: false,
    credential: '',
  };
  public phoneVerification: any = null;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.checkAuthStatus();
  }

  /**
   * On app initialization, check local storage for existing auth data.
   * If token and user data exist, restore session and schedule a token refresh.
   * If the token is expired, attempt a refresh in the background.
   */
  private checkAuthStatus(): void {
    const tokenData = this.getTokenData();
    //FIXME: there is not user data from backend
    const userData = localStorage.getItem('user');

    if (tokenData) {
      const user = JSON.parse(userData);
      this.currentUserSubject.next(user);
      // Set isAuthenticated to true regardless of expiration.
      this.isAuthenticatedSubject.next(true);

      // If token appears expired, attempt to refresh it in the background.
      // if (this.isTokenExpired()) {
      //   console.log('Token expired, attempting refresh');
      //   this.refreshToken().subscribe({
      //     next: () => {
      //       console.log('Token refreshed successfully');
      //     },
      //     error: (err) => {
      //       console.error('Token refresh failed:', err);
      //       this.clearAuthData();
      //     },
      //   });
      // } else {
      //   console.log('Token is valid, restoring session');
      // }
      // Schedule token refresh based on current token expiry.
      this.scheduleTokenRefresh();
    } else {
      console.log('No token data or user data found');
    }
  }

  /**
   * Check if the stored token is expired with a 30-second buffer.
   */
  // private isTokenExpired(): boolean {
  //   const tokenData = this.getTokenData();
  //   if (!tokenData) return true;

  //   const bufferTime = 30 * 1000;
  //   const currentTime = Date.now();
  //   const isExpired = currentTime >= tokenData.expiresAt - bufferTime;

  //   console.log(
  //     `Token expiration check: Current time: ${new Date(currentTime).toISOString()}, Expires at: ${new Date(tokenData.expiresAt).toISOString()}, Is expired: ${isExpired}`
  //   );

  //   return isExpired;
  // }

  /**
   * Schedule a refresh of the token one minute before its expiration.
   */
  private scheduleTokenRefresh(): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    const tokenData = this.getTokenData();
    if (!tokenData) return;

    // const refreshBuffer = 60 * 1000;
    // const timeUntilRefresh = Math.max(
    //   0,
    //   tokenData.expiresAt - Date.now() - refreshBuffer
    // );

    // this.tokenRefreshTimeout = setTimeout(() => {
    //   // Proceed with refresh if user is still marked as authenticated.
    //   if (this.isAuthenticatedSubject.value) {
    //     this.refreshToken().subscribe();
    //   }
    // }, timeUntilRefresh);
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Simplified getter that returns the current authentication state.
   * (Token expiration is handled via background refresh.)
   */
  public get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  public getAuthToken(): string | null {
    const tokenData = this.getTokenData();
    return tokenData ? tokenData.accessToken : null;
  }

  /**
   * Retrieve token data from localStorage.
   */
  private getTokenData(): TokenData | null {
    const tokenDataStr = localStorage.getItem('tokenData');
    if (!tokenDataStr) return null;

    try {
      const tokenData = JSON.parse(tokenDataStr);

      if (!tokenData || typeof tokenData !== 'object') {
        console.error('Invalid token data format');
        return null;
      }

      if (!tokenData.accessToken) {
        console.error('Token data missing required fields');
        return null;
      }

      // if (typeof tokenData.expiresAt !== 'number') {
      //   console.error('Token expiresAt is not a number');
      //   tokenData.expiresAt = Number(tokenData.expiresAt);
      //   if (isNaN(tokenData.expiresAt)) {
      //     return null;
      //   }
      // }

      return tokenData;
    } catch (error) {
      console.error('Error parsing token data:', error);
      localStorage.removeItem('tokenData');
      return null;
    }
  }

  public getPermissions(): string[] {
    const user = localStorage.getItem('user');
    if (!user) {
      return [];
    }

    const permissions = JSON.parse(user).permissions;
    if (!permissions || !Array.isArray(permissions)) {
      return [];
    }
    return permissions;
  }

  /**
   * Login and handle authentication success.
   */
  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.BASE_URL + `/apis/v1/auth/login`, payload)
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        catchError((error) => {
          // Preserve the original error object with status code
          return throwError(() => error);
        })
      );
  }

  /**
   * Store token, user, and permission data, update auth state, and schedule token refresh.
   */
  private handleAuthSuccess(response: AuthResponse): void {
    const tokenData: TokenData = {
      accessToken: response.accessToken,
    };

    console.log(
      `Storing token data: Access token: ${tokenData.accessToken.substring(0, 10)}...`
    );

    localStorage.setItem('tokenData', JSON.stringify(tokenData));

    if (response.user) {
      localStorage.setItem('userId', response.user.userId);
      localStorage.setItem('user', JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    }

    // if (response.profile?.fcmToken) {
    //   localStorage.setItem('fcmToken', response.profile.fcmToken);
    // }

    // if (response.permissions) {
    //   localStorage.setItem('permissions', JSON.stringify(response.permissions));
    // }

    this.isAuthenticatedSubject.next(true);
    // this.scheduleTokenRefresh();
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`/apis/v1/auth/register`, userData);
  }

  /**
   * Call the refresh-token API to update the JWT.
   */
  refreshToken(): Observable<AuthResponse> {
    const currentTokenData = this.getTokenData();
    if (!currentTokenData) {
      console.error('No token data available for refresh');
      return throwError(() => new Error('No token data available'));
    }

    console.log('Attempting to refresh token');
    return this.http
      .post<AuthResponse>(`/apis/v1/auth/refresh`, {
        accessToken: currentTokenData.accessToken,
      })
      .pipe(
        tap((response) => {
          console.log('Token refresh successful');
          this.handleAuthSuccess(response);
        }),
        catchError((error) => {
          console.error('Token refresh failed:', error);
          this.logout();
          return throwError(() => new Error('Token refresh failed'));
        })
      );
  }

  logout(): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  private clearAuthData(): void {
    localStorage.removeItem('tokenData');
    localStorage.removeItem('userId');
    localStorage.removeItem('fcmToken');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  verifyToken(): Observable<boolean> {
    const token = this.getAuthToken();

    if (!token) {
      return of(false);
    }

    return this.http.get<any>(`/apis/v1/auth/refresh`).pipe(
      map(() => true),
      catchError(() => {
        this.clearAuthData();
        return of(false);
      })
    );
  }

  private getDeviceInfo(): {
    deviceId: string;
    deviceName: string;
    deviceModel: string;
    deviceType: string;
    appVersion: string;
  } {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    return {
      deviceId: 'string',
      deviceName: 'string',
      deviceModel: 'string',
      deviceType: 'string',
      appVersion: 'string',
    };
  }

  createLoginPayload(
    isEmail: boolean,
    credential: string,
    password: string
  ): LoginPayload {
    return {
      isEmail: isEmail,
      credential: credential,
      password: password,
    };
  }

  /* ============================================> Forgot Password Start <============================================*/

  getValidationData(): ValidationData {
    return this.validationData;
  }

  setValidationData(data: ValidationData): void {
    this.validationData = data;
  }

  /* ============================================> Forgot Password end <============================================*/

  hasPermission(permission: string | string[]): boolean {
    const permissions = this.getPermissions();

    if (Array.isArray(permission)) {
      return permission.some((p) => permissions.includes(p));
    } else {
      return permissions.includes(permission);
    }
  }
}
