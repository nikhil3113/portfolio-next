"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FolderKanban, Plus, Eye } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  totalProjects: number;
  totalBlogs: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalBlogs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((res) => res.json()),
      fetch("/api/blog").then((res) => res.json()),
    ])
      .then(([projects, blogs]) => {
        setStats({
          totalProjects: projects.length || 0,
          totalBlogs: blogs.length || 0,
        });
      })
      .catch((error) => {
        console.error("Error fetching stats:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your portfolio content
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Projects
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {loading ? "..." : stats.totalProjects}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Blogs
              </CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {loading ? "..." : stats.totalBlogs}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Projects Section */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-blue-600" />
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
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
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
        </div>
      </div>
    </div>
  );
}
