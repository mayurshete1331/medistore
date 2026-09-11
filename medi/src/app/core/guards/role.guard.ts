import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const expectedRoles = route.data?.['roles'] as UserRole[] | undefined;
  const userRole = authService.currentUser()?.role;

  if (!expectedRoles || (userRole && expectedRoles.includes(userRole))) {
    return true;
  }

  // If role is not permitted, route to user's specific authorized portal
  if (userRole === 'DOCTOR') {
    return router.createUrlTree(['/doctor']);
  } else if (userRole === 'CUSTOMER') {
    return router.createUrlTree(['/customer']);
  } else if (userRole === 'STORE_OWNER') {
    return router.createUrlTree(['/billing']);
  }

  return router.createUrlTree(['/login']);
};
