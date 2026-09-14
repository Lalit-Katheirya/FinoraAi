import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  if (!auth.bootstrapped()) {
    return auth.bootstrap().pipe(map((ok) => (ok ? true : router.createUrlTree(['/login']))));
  }

  return router.createUrlTree(['/login']);
};
