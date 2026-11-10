"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Blog {
  id: string;
  h1: string;
  metaDescription: string;
  slug: string;
  content: string;
  imageUrl?: string;
  author: string;
  createdAt?: string;
}

export default function AllBlogsTable() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/blog");
        if (res.status === 401) {
          router.replace("/auth/signin");
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load blogs (${res.status})`);
        }
        const data: unknown = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("Unexpected blog list response");
        }
        if (!cancelled) {
          setBlogs(data);
          setError(null);
        }
      } catch (err) {
        console.error("Error loading blogs:", err);
        if (!cancelled) {
          setError("Could not load blogs. Please refresh and try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-8 max-w-5xl rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold text-foreground">Blogs</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold tracking-tight">All Blogs</h1>
        <Button asChild>
          <a href="/admin/blog/add">+ New Blog</a>
        </Button>
      </div>
      <div className="rounded-xl border bg-white dark:bg-black shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blogs.map((blog) => (
              <TableRow key={blog.id} className="hover:bg-muted transition">
                <TableCell>
                  {blog.imageUrl ? (
                    <div className="relative h-12 w-20 rounded overflow-hidden border bg-gray-100">
                      <Image
                        src={blog.imageUrl}
                        alt={blog.h1}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-20 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                      N/A
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900 dark:text-gray-200">{blog.h1}</div>
                  <div className="text-xs text-gray-500 line-clamp-1">
                    {blog.metaDescription}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{blog.author}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell text-gray-500 text-xs">
                  {blog.createdAt
                    ? new Date(blog.createdAt).toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell className="text-right space-x-2 flex justify-center items-center">
                  <Button size="sm" variant="outline" asChild>
                    <a href={`/admin/blog/update/${blog.slug}`}>Edit</a>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                  // onClick={() => handleDelete(blog.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {blogs.length === 0 && (
          <div className="p-6 text-center text-gray-500">No blogs found.</div>
        )}
      </div>
    </div>
  );
}
