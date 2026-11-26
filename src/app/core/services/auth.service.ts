
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ChatUser, UsersResponse } from '../../models/auth.model';

import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  AuthResponse,
  AuthUser,
  ProfileResponse
} from '../../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = 'http://localhost:5000/api';

  private readonly TOKEN_KEY = 'chat_token';
  private readonly USER_KEY = 'chat_user';

  private currentUserSubject =
    new BehaviorSubject<AuthUser | null>(this.getStoredUser());

  currentUser$ = this.currentUserSubject.asObservable();

  // Register user
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${this.apiUrl}/auth/register`,
      data
    );
  }

  // Login user
  login(data: LoginRequest): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/auth/login`,
      data
    ).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  // Save authentication session
  private setSession(response: AuthResponse): void {

    localStorage.setItem(
      this.TOKEN_KEY,
      response.token
    );

    localStorage.setItem(
      this.USER_KEY,
      JSON.stringify(response.user)
    );

    this.currentUserSubject.next(response.user);
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Get stored user
  getStoredUser(): AuthUser | null {

    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  // Check authentication
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Get current user profile from backend
  getProfile(): Observable<ProfileResponse> {

    return this.http.get<ProfileResponse>(
      `${this.apiUrl}/users/profile`
    ).pipe(
      tap(response => {
        localStorage.setItem(
          this.USER_KEY,
          JSON.stringify(response.user)
        );

        this.currentUserSubject.next(response.user);
      })
    );
  }

  // Logout user
  logout(): void {

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);

    this.currentUserSubject.next(null);

    this.router.navigate(['/login']);
  }

getUsers() {
  return this.http.get<UsersResponse>(
    `${this.apiUrl}/users`
  );
}

}
