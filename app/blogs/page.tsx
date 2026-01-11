import { BlogCard } from "@/components/blog/BlogCard";
import { getBlogs } from "@/lib/action/blogs";

export default async function Blogs() {
  const blogs = await getBlogs();

  if (!blogs || blogs.length === 0) {
    <div className="text-center py-12">
      <p className="text-gray-500 text-lg">No blogs found.</p>
    </div>;
  }

  return (
    <div className="md:mx-32 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
          Blogs
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Discover my latest articles and insights
        </p>
      </div>

      <BlogCard blogs={blogs} />
    </div>
  );
}
