import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken();
  const isRefresh = req.url.includes('/auth/refresh');
  const isAuthPublic =
    req.url.includes('/auth/login') || req.url.includes('/auth/register');

  const authedReq =
    token && !isRefresh && !isAuthPublic
      ? req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })
      : req.clone({ withCredentials: true });

  return next(authedReq).pipe(
    catchError((err: { status?: number }) => {
      if (err.status !== 401 || isRefresh || isAuthPublic) {
        return throwError(() => err);
      }

      return auth.refresh().pipe(
        switchMap((newToken) => {
          if (!newToken) return throwError(() => err);
          return next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
              withCredentials: true,
            })
          );
        }),
        catchError((refreshErr) => throwError(() => refreshErr))
      );
    })
  );
};
