import { ProjectActions } from "@/components/project/TableActions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Project } from "@prisma/client";

export const dynamic = "force-dynamic";

type ProjectsResult =
  | { ok: true; projects: Project[] }
  | { ok: false; message: string };

async function getProjects(): Promise<ProjectsResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return { ok: true, projects };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { ok: false, message: "Could not load projects." };
  }
}

export default async function Projects() {
  const result = await getProjects();

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <p className="mt-3 text-muted-foreground">{result.message}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/project">Try again</Link>
        </Button>
      </div>
    );
  }

  if (result.projects.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <p className="mt-3 text-muted-foreground">No projects yet.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/project/add">Add your first project</Link>
        </Button>
      </div>
    );
  }

  const projects = result.projects;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Projects
          </h1>
          <p className="text-muted-foreground">
            Manage your portfolio projects ({projects.length} total)
          </p>
        </div>
        <div className="bg-card backdrop-blur-sm rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between ">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                All Projects
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                A comprehensive list of all your portfolio projects
              </p>
            </div>
            <Link
              href={`/admin/project/add`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Add
            </Link>
          </div>

          <div className="overflow-x-auto bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted border-b border-border">
                  <TableHead className="font-semibold text-foreground py-4 px-6">
                    Project Title
                  </TableHead>
                  <TableHead className="font-semibold text-foreground py-4 px-6">
                    Site Link
                  </TableHead>
                  <TableHead className="font-semibold text-foreground py-4 px-6">
                    Github Link
                  </TableHead>
                  <TableHead className="font-semibold text-foreground py-4 px-6">
                    Created At
                  </TableHead>
                  <TableHead className="font-semibold text-foreground py-4 px-6 text-center">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project, index) => (
                  <TableRow
                    key={project.id}
                    className="hover:bg-muted transition-colors border-b border-border"
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                          {project.title.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {project.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Project #{index + 1}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Link
                        href={project.siteLink}
                        className="text-muted-foreground break-all hover:text-accent-text"
                      >
                        {project.siteLink}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Link
                        href={project.githubLink}
                        className="text-muted-foreground break-all hover:text-accent-text"
                      >
                        {project.githubLink}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="text-muted-foreground">
                        {project.createdAt.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-center flex items-center space-x-2 justify-center">
                      <ProjectActions projectId={project.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="px-6 py-4 bg-muted border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Showing {projects.length} project
              {projects.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
