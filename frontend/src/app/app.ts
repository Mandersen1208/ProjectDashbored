import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobSearch } from './components/job-search/job-search';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  imports: [CommonModule, JobSearch, MenubarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('ProjectDashbored - Job Search');

  menuItems: MenuItem[] = [
    {
      label: 'Home',
      icon: 'pi pi-home'
    },
    {
      label: 'Job Search',
      icon: 'pi pi-search'
    },
    {
      label: 'Dashboard',
      icon: 'pi pi-th-large'
    }
  ];
}
