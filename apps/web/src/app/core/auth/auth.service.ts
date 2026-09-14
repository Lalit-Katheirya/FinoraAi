import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { ApiService } from '../services/api.service';
import type { AuthPayload, CurrencyCode, UserDto } from '../models';

const TOKEN_KEY = 'finora_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly accessTokenSignal = signal<string | null>(this.readToken());
  private readonly userSignal = signal<UserDto | null>(null);
  private readonly bootstrappedSignal = signal(false);
  private refreshInFlight$: Observable<string | null> | null = null;

  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessTokenSignal());
  readonly bootstrapped = this.bootstrappedSignal.asReadonly();

  bootstrap(): Observable<boolean> {
    if (!this.accessTokenSignal()) {
      return this.refresh().pipe(
        map((token) => !!token),
        tap(() => this.bootstrappedSignal.set(true)),
        catchError(() => {
          this.clearSession();
          this.bootstrappedSignal.set(true);
          return of(false);
        })
      );
    }

    return this.api.get<{ user: UserDto }>('/auth/me').pipe(
      tap((res) => this.userSignal.set(res.user)),
      map(() => true),
      catchError(() =>
        this.refresh().pipe(
          map((token) => !!token),
          catchError(() => {
            this.clearSession();
            return of(false);
          })
        )
      ),
      finalize(() => this.bootstrappedSignal.set(true))
    );
  }

  login(email: string, password: string): Observable<UserDto> {
    return this.api.post<AuthPayload>('/auth/login', { email, password }).pipe(
      tap((payload) => this.applyAuth(payload)),
      map((payload) => payload.user)
    );
  }

  register(payload: {
    name: string;
    email: string;
    password: string;
    currency?: CurrencyCode;
    timezone?: string;
  }): Observable<UserDto> {
    return this.api.post<AuthPayload>('/auth/register', payload).pipe(
      tap((res) => this.applyAuth(res)),
      map((res) => res.user)
    );
  }

  logout(): Observable<unknown> {
    return this.api.post('/auth/logout').pipe(
      catchError(() => of(null)),
      finalize(() => {
        this.clearSession();
        void this.router.navigateByUrl('/login');
      })
    );
  }

  refresh(): Observable<string | null> {
    if (this.refreshInFlight$) return this.refreshInFlight$;

    this.refreshInFlight$ = this.api.post<AuthPayload>('/auth/refresh').pipe(
      tap((payload) => this.applyAuth(payload)),
      map((payload) => payload.accessToken),
      catchError((err) => {
        this.clearSession();
        return throwError(() => err);
      }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      shareReplay(1)
    );

    return this.refreshInFlight$;
  }

  me(): Observable<UserDto> {
    return this.api.get<{ user: UserDto }>('/auth/me').pipe(
      tap((res) => this.userSignal.set(res.user)),
      map((res) => res.user)
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<unknown> {
    return this.api.post('/auth/change-password', { currentPassword, newPassword }).pipe(
      tap(() => this.clearSession())
    );
  }

  deleteAccount(): Observable<unknown> {
    return this.api.delete('/auth/account').pipe(
      tap(() => {
        this.clearSession();
        void this.router.navigateByUrl('/login');
      })
    );
  }

  updateLocalUser(partial: Partial<UserDto>): void {
    const current = this.userSignal();
    if (!current) return;
    this.userSignal.set({ ...current, ...partial });
  }

  private applyAuth(payload: AuthPayload): void {
    this.setToken(payload.accessToken);
    this.userSignal.set(payload.user);
  }

  private setToken(token: string): void {
    this.accessTokenSignal.set(token);
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  private readToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  private clearSession(): void {
    this.accessTokenSignal.set(null);
    this.userSignal.set(null);
    sessionStorage.removeItem(TOKEN_KEY);
  }
}
