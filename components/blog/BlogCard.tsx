"use client";

import { Card, CardHeader, CardContent, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import { Calendar } from "lucide-react";

interface BlogData {
  id: string;
  h1: string;
  metaDescription: string;
  content: string;
  imageUrl: string;
  author: string;
  slug: string;
  createdAt: Date;
}

function calculateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.ceil(words / 200); 
}

export function BlogCard({ blogs }: { blogs: BlogData[] }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {blogs.map((blog) => {
        const readTime = calculateReadTime(blog.content);
        return (
          <Link href={`/blogs/${blog.slug}`} key={blog.id} prefetch={true}>
            <div className="py-6 rounded-lg">
              <h2 className="text-black dark:text-white text-xl md:text-2xl font-bold mb-2">
                {blog.h1}
              </h2>
              <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm mb-2 gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(blog.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="mx-2">•</span>
                <span>{readTime} min read</span>
              </div>
              <div className="flex gap-5 items-start mt-5">
                <div className="relative w-40 h-32 overflow-hidden rounded-sm hidden md:block">
                  {blog.imageUrl ? (
                    <CldImage
                      src={blog.imageUrl}
                      alt={blog.h1}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No Image</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="dark:text-gray-300 text-gray-700 md:text-lg text-md mb-3">
                    {blog.metaDescription || blog.content.slice(0, 80)}...
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}