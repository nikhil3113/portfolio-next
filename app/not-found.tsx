import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="flex flex-col items-center gap-4">
        <span className="rounded-full bg-muted p-4">
          <Ghost className="h-12 w-12 text-primary" />
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          404
        </h1>
        <h2 className="text-xl font-semibold text-muted-foreground">
          Oops! Page not found.
        </h2>
        <p className="max-w-md text-muted-foreground mb-4">
          The page you are looking for doesn&apos;t exist or has been moved.
          <br />
          Please check the URL or return to the homepage.
        </p>
        <Button asChild size="lg">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
