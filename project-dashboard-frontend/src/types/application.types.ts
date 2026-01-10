export interface Application {
  id: number;
  userId: number;
  jobTitle: string;
  companyName?: string;
  location?: string;
  jobUrl?: string;
  status: ApplicationStatus;
  dateApplied?: string;
  resumeVersion?: string;
  coverLetterVersion?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ApplicationStatus = 
  | 'applied'
  | 'phone_screen'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationStats {
  total: number;
  applied: number;
  phone_screen: number;
  interview: number;
  offer: number;
  rejected: number;
}

export interface CreateApplicationRequest {
  userId: number;
  jobTitle: string;
  companyName?: string;
  jobUrl?: string;
  location?: string;
  status?: ApplicationStatus;
  dateApplied?: string;
  resumeVersion?: string;
  coverLetterVersion?: string;
  notes?: string;
}

export interface UpdateApplicationRequest {
  status: ApplicationStatus;
  dateApplied: string;
  resumeVersion?: string;
  coverLetterVersion?: string;
  notes?: string;
}
