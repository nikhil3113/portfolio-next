import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BlogActions } from "@/components/blog/BlogActions";
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
import Link from "next/link";

export const dynamic = "force-dynamic";

type BlogRow = {
  id: string;
  h1: string;
  metaDescription: string;
  slug: string;
  imageUrl: string;
  author: string;
  createdAt: Date;
};

export default async function AllBlogsTable() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  let blogs: BlogRow[];
  try {
    blogs = await prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        h1: true,
        metaDescription: true,
        slug: true,
        imageUrl: true,
        author: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return (
      <div className="mx-auto mt-8 max-w-5xl rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold text-foreground">Blogs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Could not load blogs. Please try again.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/blog">Try again</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold tracking-tight">All Blogs</h1>
        <Button asChild>
          <Link href="/admin/blog/add">+ New Blog</Link>
        </Button>
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
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
                    <div className="relative h-12 w-20 rounded overflow-hidden border bg-muted">
                      <Image
                        src={blog.imageUrl}
                        alt={blog.h1}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-20 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                      N/A
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{blog.h1}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {blog.metaDescription}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{blog.author}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                  {blog.createdAt
                    ? blog.createdAt.toLocaleDateString()
                    : "-"}
                </TableCell>
                <TableCell className="text-right space-x-2 flex justify-center items-center">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/blog/update/${blog.slug}`}>Edit</Link>
                  </Button>
                  <BlogActions slug={blog.slug} title={blog.h1} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {blogs.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            No blogs found.
          </div>
        )}
      </div>
    </div>
  );
}
