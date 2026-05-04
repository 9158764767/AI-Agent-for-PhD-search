export enum ApplicationStatus {
  INTERESTED = 'interested',
  APPLIED = 'applied',
  INTERVIEWING = 'interviewing',
  OFFER = 'offer',
  REJECTED = 'rejected'
}

export interface Profile {
  name: string;
  email: string;
  education: { degree: string; uni: string; year: string }[];
  skills: string[];
  interests: string[];
  bio: string;
}

export interface PhDPosition {
  id: string;
  title: string;
  university: string;
  location: string;
  deadline: string;
  applyLink: string;
  description: string;
  contactEmail?: string;
  matchScore: number; // 0-100
  matchAnalysis: string;
}

export interface CareerInsight {
  field: string;
  marketTrend: string;
  inDemandSkills: string[];
  guidance: string;
}
