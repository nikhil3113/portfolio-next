import Image from "next/image";
import { Card, CardHeader, CardContent, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import Link from "next/link";

interface BlogData {
  id: string;
  h1: string;
  metaDescription: string;
  content: string;
  imageUrl: string;
  author: string;
  createdAt: Date;
}

export function BlogCard({ blogs }: { blogs: BlogData[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <Link href={`/blogs/${blog.id}`} key={blog.id}>
          <Card className="overflow-hidden transition-shadow duration-300 cursor-pointer group shadow-none">
            <div className="relative h-48 w-full overflow-hidden">
              {blog.imageUrl ? (
                <Image
                  src={blog.imageUrl}
                  alt={blog.h1}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No Image</span>
                </div>
              )}
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {blog.h1}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>By {blog.author}</span>
                <span>•</span>
                <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {blog.metaDescription || blog.content.slice(0, 120)}...
              </p>
              <Badge variant="secondary" className="text-xs">
                Read More
              </Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
