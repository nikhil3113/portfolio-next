import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  Mail,
  Pencil,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardStats } from "@/lib/admin/stats";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const [stats, unreadContacts] = await Promise.all([
    getDashboardStats(),
    prisma.contact.count({
      where: { OR: [{ isRead: false }, { isRead: null }] },
    }),
  ]);

  const { totalProjects, totalBlogs } = stats;
  const maxViews = Math.max(1, ...stats.topBlogs.map((blog) => blog.views));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your portfolio content
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-card backdrop-blur-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Projects
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-accent-text" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {totalProjects}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card backdrop-blur-sm border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Blogs
              </CardTitle>
              <FileText className="h-4 w-4 text-accent-text" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {totalBlogs}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Stats */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Views
                </CardTitle>
                <Eye className="h-4 w-4 text-accent-text" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stats.totalViews}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Published Posts
                </CardTitle>
                <FileText className="h-4 w-4 text-accent-text" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stats.publishedBlogs}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Drafts
                </CardTitle>
                <Pencil className="h-4 w-4 text-accent-text" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stats.draftBlogs}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Hidden Projects
                </CardTitle>
                <EyeOff className="h-4 w-4 text-accent-text" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stats.hiddenProjects}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Posts */}
        <Card className="mb-8 bg-card backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle>Top Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topBlogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No posts yet.{" "}
                <Link
                  href="/admin/blog/add"
                  className="font-medium text-accent-text hover:underline"
                >
                  Write your first post
                </Link>
                .
              </p>
            ) : (
              <div className="divide-y divide-border">
                {stats.topBlogs.map((blog) => (
                  <div key={blog.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-4">
                      <Link
                        href={`/blogs/${blog.slug}`}
                        className="truncate text-sm text-foreground hover:text-accent-text"
                      >
                        {blog.h1}
                      </Link>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {blog.views} views
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted">
                      <div
                        className="h-1 rounded-full bg-primary"
                        style={{
                          width: `${Math.round((blog.views / maxViews) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Projects Section */}
          <Card className="bg-card backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-accent-text" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" variant="default">
                <Link href="/admin/project/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Project
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/admin/project">
                  <Eye className="mr-2 h-4 w-4" />
                  View All Projects
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Blogs Section */}
          <Card className="bg-card backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-text" />
                Blogs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" variant="default">
                <Link href="/admin/blog/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Blog
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/admin/blog">
                  <Eye className="mr-2 h-4 w-4" />
                  View All Blogs
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Messages Section */}
          <Card className="bg-card backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-accent-text" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {unreadContacts} unread message{unreadContacts === 1 ? "" : "s"}
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/admin/contact">
                  <Eye className="mr-2 h-4 w-4" />
                  Open Inbox
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
