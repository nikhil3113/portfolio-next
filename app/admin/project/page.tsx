import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

async function getPorjects() {
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
  const projects = await getPorjects();
  if (!projects || projects.length === 0) {
    return (
      <div className=" grid place-items-center h-screen">
        <h1 className="text-3xl font-bold">No Project Found</h1>
      </div>
    );
  }

  return (
    <div>
      <h1>Projects</h1>
      <div>
        <Table>
          <TableCaption>A list all your projects.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Title</TableHead>
              <TableHead>Site Link</TableHead>
              <TableHead>Github Link</TableHead>
              <TableHead className="text-right">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.title}</TableCell>
                <TableCell>{project.siteLink}</TableCell>
                <TableCell>{project.githubLink}</TableCell>
                <TableCell className="text-right">
                  {project.createdAt.toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
