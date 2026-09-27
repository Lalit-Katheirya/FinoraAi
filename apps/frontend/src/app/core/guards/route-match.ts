import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/** Public marketing home matches only for signed-out visitors. */
export const guestMatch: CanMatchFn = () => {
  const auth = inject(AuthService);

  if (auth.isAuthenticated()) {
    return false;
  }

  if (!auth.bootstrapped()) {
    return auth.bootstrap().pipe(map((ok) => !ok));
  }

  return true;
};
