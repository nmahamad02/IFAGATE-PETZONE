import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const username = localStorage.getItem('username');
    
    if (username === null || username.trim() === '') {
      // User is NOT logged in, redirect to login
      this.router.navigate(['/authentication/login']);
      return false;
    }
    
    // User is logged in, allow access
    return true;
  }
}
