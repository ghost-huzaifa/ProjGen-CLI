import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  BASE_URL = environment.apiUrl;
  private http = inject(HttpClient);
  private token: string;
  constructor() {
    this.token = localStorage.getItem('Token');
  }

  /**
   * Generic GET request method
   * @param url - Full URL or endpoint to fetch data from
   * @param options - Optional configuration for the request
   * @returns Observable of the response
   */
  get<T>(
    url: string,
    options: {
      params?: Record<string, string | number>;
      headers?: Record<string, string>;
    } = {}
  ): Observable<T> {
    return this.http
      .get<T>(url, {
        params: options.params,
        headers: options.headers,
      })
      .pipe(catchError(this.handleError));
  }

  post<T>(
    url: string,
    payload: any,
    options: {
      headers?: Record<string, string>;
    } = {}
  ): Observable<T> {
    return this.http
      .post<T>(`${this.BASE_URL}/${url}`, payload, {
        headers: options.headers,
      })
      .pipe(catchError(this.handleError));
  }

  // Generic error handler
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'Forbidden. You do not have permission.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
