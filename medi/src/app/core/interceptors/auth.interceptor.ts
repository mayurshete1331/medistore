import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  let authReq = req;
  try {
    const token = localStorage.getItem('medi_jwt_token');
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  } catch (e) {
    // LocalStorage access fails in private/restricted modes
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 Unauthorized occurs on an authenticated endpoint, terminate session safely
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
