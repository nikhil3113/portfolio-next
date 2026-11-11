"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProjectActionsProps {
  projectId: string;
}

export function ProjectActions({ projectId }: ProjectActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "delete",
      });

      if (response.ok) {
        alert("Project deleted successfully");
        router.refresh(); // Refresh the page
      } else {
        alert("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("An error occurred while deleting the project");
    }
  };

  return (
    <div className="flex items-center space-x-2 justify-center">
      <Link
        href={`/admin/project/update/${projectId}`}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        Update
      </Link>
      <Button
        onClick={handleDelete}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:opacity-90 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        Delete
      </Button>
    </div>
  );
}
