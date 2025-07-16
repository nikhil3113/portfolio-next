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
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        Update
      </Link>
      <Button
        onClick={handleDelete}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        Delete
      </Button>
    </div>
  );
}
