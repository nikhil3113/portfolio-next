import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FolderKanban, Mail, Plus, Eye } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminCounts } from "@/lib/admin/stats";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const [{ totalProjects, totalBlogs }, unreadContacts] = await Promise.all([
    getAdminCounts(),
    prisma.contact.count({
      where: { OR: [{ isRead: false }, { isRead: null }] },
    }),
  ]);

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
