import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobSearch } from './components/job-search/job-search';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    JobSearch,
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
}
