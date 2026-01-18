import { prisma } from "../prisma";
import redis from "../redis";

export async function getBlogs() {
  try {
    const cachedBlogs = await redis.get("blogs");
    if (cachedBlogs) {
      return JSON.parse(cachedBlogs);
    }
    const blogs = await prisma.blog.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    await redis.set("blogs", JSON.stringify(blogs));
    return blogs;
  } catch (error) {
    console.log("Error fetching blogs:", error);
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
