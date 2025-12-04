"use server";

import { prisma } from "../prisma";
import redis from "../redis";

export async function getProjects() {
  try {
    const cached = await redis.get("projects");
    if (cached) {
      return JSON.parse(cached);
    }
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedProjects = projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      image: project.imageUrl,
      tags: project.tags,
      siteLink: project.siteLink,
      githubLink: project.githubLink,
    }));

    await redis.set("projects", JSON.stringify(mappedProjects));
    return mappedProjects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}
