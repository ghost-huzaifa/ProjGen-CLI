import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
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
  get<T>(url: string, options: {
    params?: Record<string, string | number>,
    headers?: Record<string, string>
  } = {}): Observable<T> {
    return this.http.get<T>(`/apis/v1${url}`, {
      params: options.params,
      headers: options.headers
    });
  }

  post<T>(url: string, payload: any, options: {
    headers?: Record<string, string>
  } = {}): Observable<T> {
    return this.http.post<T>(`/apis/v1${url}`, payload, {
      headers: options.headers
    });
  }

  patch<T>(url: string, payload: any, options: {
    headers?: Record<string, string>
  } = {}): Observable<T> {
    return this.http.patch<T>(`/apis/v1${url}`, payload, {
      headers: options.headers
    });
  }

  delete<T>(url: string, options: {
    headers?: Record<string, string>
  } = {}): Observable<T> {
    return this.http.delete<T>(`/apis/v1${url}`, {
      headers: options.headers
    });
  }
}
