export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  siteLink: string;
  githubLink: string;
}

export type ProjectCardData = Omit<Project, "id">;
