import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  const user = localStorage.getItem('user_session');

  if (user) {
    return true;
  } else {
    console.log("no secion")
    router.navigate(['/login']);
    return false;
  }
};
