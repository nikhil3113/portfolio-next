"use server";

import { prisma } from "../prisma";

export async function getProjects() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });
    return projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      image: project.imageUrl,
      tags: project.tags,
      siteLink: project.siteLink,
      githubLink: project.githubLink,
    }));
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}
