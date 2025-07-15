import { ProjectActions } from "@/components/project/TableActions";
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
import Link from "next/link";

async function getProjects() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error("Unauthorized access");
    }

    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return projects;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export default async function Projects() {
  const projects = await getProjects();

  if (!projects || projects.length === 0) {
    return (
      <div className=" grid place-items-center h-screen">
        <h1 className="text-3xl font-bold">No Project Found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your portfolio projects ({projects.length} total)
          </p>
        </div>

        {/* Enhanced Table Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              All Projects
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              A comprehensive list of all your portfolio projects
            </p>
          </div>

          <div className="overflow-x-auto bg-white/80 dark:bg-slate-800/80">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="font-semibold text-gray-900 dark:text-white py-4 px-6">
                    Project Title
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white py-4 px-6">
                    Site Link
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white py-4 px-6">
                    Github Link
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white py-4 px-6">
                    Created At
                  </TableHead>
                  <TableHead className="font-semibold text-gray-900 dark:text-white py-4 px-6 text-center">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project, index) => (
                  <TableRow
                    key={project.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors border-b border-gray-100 dark:border-gray-800"
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                          {project.title.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {project.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Project #{index + 1}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Link
                        href={project.siteLink}
                        className="text-gray-700 dark:text-gray-300 break-all hover:text-blue-500"
                      >
                        {project.siteLink}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Link
                        href={project.githubLink}
                        className="text-gray-700 dark:text-gray-300 break-all hover:text-blue-500"
                      >
                        {project.githubLink}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="text-gray-600 dark:text-gray-400">
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

          {/* Table Footer */}
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Showing {projects.length} project
              {projects.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
