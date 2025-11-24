import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    PasswordModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() loginSuccess = new EventEmitter<void>();

  credentials: LoginRequest = {
    username: '',
    password: ''
  };

  loading: boolean = false;
  errorMessage: string = '';

  constructor(private authService: AuthService) {}

  /**
   * Handle dialog close
   */
  onDialogHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  /**
   * Handle login form submission
   */
  onLogin(): void {
    // Clear previous errors
    this.errorMessage = '';

    // Validate inputs
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    // Set loading state
    this.loading = true;

    // Call auth service
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.loading = false;
        this.loginSuccess.emit();
        this.onDialogHide();
      },
      error: (error) => {
        console.error('Login failed', error);
        this.loading = false;
        this.errorMessage = error.error?.message || 'Invalid username or password';
      }
    });
  }

  /**
   * Reset form fields
   */
  private resetForm(): void {
    this.credentials = {
      username: '',
      password: ''
    };
    this.errorMessage = '';
    this.loading = false;
  }

  /**
   * Handle Enter key press in form
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onLogin();
    }
  }
}
