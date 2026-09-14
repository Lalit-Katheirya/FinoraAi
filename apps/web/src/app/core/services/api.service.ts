import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiSuccessBody, PaginationMeta } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiUrl;

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined | null>): Observable<T> {
    return this.http
      .get<ApiSuccessBody<T>>(this.url(path), {
        params: this.toParams(params),
        withCredentials: true,
      })
      .pipe(map((res) => res.data));
  }

  getWithMeta<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined | null>
  ): Observable<{ data: T; meta?: PaginationMeta }> {
    return this.http
      .get<ApiSuccessBody<T>>(this.url(path), {
        params: this.toParams(params),
        withCredentials: true,
      })
      .pipe(map((res) => ({ data: res.data, meta: res.meta })));
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http
      .post<ApiSuccessBody<T>>(this.url(path), body ?? {}, { withCredentials: true })
      .pipe(map((res) => res.data));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiSuccessBody<T>>(this.url(path), body, { withCredentials: true })
      .pipe(map((res) => res.data));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<ApiSuccessBody<T>>(this.url(path), { withCredentials: true })
      .pipe(map((res) => res.data));
  }

  upload<T>(path: string, formData: FormData): Observable<T> {
    return this.http
      .post<ApiSuccessBody<T>>(this.url(path), formData, { withCredentials: true })
      .pipe(map((res) => res.data));
  }

  blob(path: string, params?: Record<string, string | number | boolean | undefined | null>): Observable<Blob> {
    return this.http.get(this.url(path), {
      params: this.toParams(params),
      withCredentials: true,
      responseType: 'blob',
    });
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private toParams(
    params?: Record<string, string | number | boolean | undefined | null>
  ): HttpParams | undefined {
    if (!params) return undefined;
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}
