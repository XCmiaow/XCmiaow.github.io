// Shared type definitions for resume data

export interface Person {
  name: string;
  brandMark: string;
  tagline: string;
  location: string;
}

export interface Education {
  school: string;
  college: string;
  major: string;
  period: string;
  degree: string;
  year: string;
}

export interface CommonPerson {
  email: string;
  github: string;
  githubUser: string;
  avatar: string;
}

export interface CommonEducation {
  gpa: number;
  rankClass: number;
  rankMajor: number;
}

export interface Highlight {
  id: string;
  title: string;
  desc: string;
}

export interface CompetitionDetail {
  topic: string;
  role: string;
  model: string;
}

export interface Competition {
  year: string;
  level: 'international' | 'national' | 'provincial' | 'school' | 'college';
  title: string;
  note: string;
  details?: CompetitionDetail;
}

export interface Skill {
  category: string;
  desc: string;
  items: string[];
}

export interface Project {
  id: string;
  title: string;
  desc: string;
  abilities: string;
  todo?: string;
}

export interface CommonProject {
  id: string;
  tags: string[];
  link: string;
}

export interface Experience {
  period: string;
  title: string;
  desc: string;
}

export interface ResearchArea {
  name: string;
  note: string;
}

export interface ResearchInterests {
  tagline: string;
  summary: string;
  areas: ResearchArea[];
}

export interface ResumeData {
  person: Person;
  education: Education;
  highlights: Highlight[];
  competitions: Competition[];
  skills: Skill[];
  projects: Project[];
  experience: Experience[];
  volunteer: string[];
  researchInterests: ResearchInterests;
}
