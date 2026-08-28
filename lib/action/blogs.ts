import { prisma } from "../prisma";

export async function getBlogs() {
  try {
    const blogs = await prisma.blog.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        h1: true,
        metaDescription: true,
        imageUrl: true,
        author: true,
        slug: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return blogs;
  } catch (error) {
    console.log("Error fetching blogs:", error);
    return [];
  }
}

export async function getLatestBlogs(count = 2) {
  try {
    const blogs = await prisma.blog.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        h1: true,
        metaDescription: true,
        imageUrl: true,
        author: true,
        slug: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: count,
    });
    return blogs;
  } catch (error) {
    console.log("Error fetching latest blogs:", error);
    return [];
  }
}

export async function getBlogBySlug(slug: string) {
  try {
    const blog = await prisma.blog.findUnique({
      where: {
        slug,
        isPublished: true,
      },
    });
    return blog;
  } catch (error) {
    console.log("Error fetching blog by ID:", error);
    return null;
  }
}
