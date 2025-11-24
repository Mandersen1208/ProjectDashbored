import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobSearch } from './components/job-search/job-search';
import { Login } from './components/Authentication/login/login';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuItem } from 'primeng/api';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    JobSearch,
    Login,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    SplitButtonModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ProjectDashbored - Job Search');
  isLoginModalVisible = false;

  items: MenuItem[] = [
    {
      label: 'Save As',
      icon: 'pi pi-file'
    },
    {
      label: 'Export',
      icon: 'pi pi-download'
    }
  ];

  constructor(public authService: AuthService) {}

  /**
   * Show the login modal
   */
  showLoginModal(): void {
    this.isLoginModalVisible = true;
  }

  /**
   * Handle successful login
   */
  onLoginSuccess(): void {
    console.log('Login successful!');
    // You can add additional logic here, like redirecting to a different page
  }

  /**
   * Handle logout
   */
  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logged out successfully');
      },
      error: (error) => {
        console.error('Logout failed', error);
      }
    });
  }
}
