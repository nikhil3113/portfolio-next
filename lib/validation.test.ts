import { describe, expect, it } from "vitest";
import {
  blogCreateSchema,
  httpUrlSchema,
  imageUrlSchema,
  projectCreateSchema,
  slugSchema,
} from "@/lib/validation";

const validProject = {
  title: "Portfolio",
  description: "A personal portfolio",
  tags: ["nextjs"],
  siteLink: "https://example.com",
  githubLink: "https://github.com/example/portfolio",
  imageUrl: "https://res.cloudinary.com/demo/image/upload/x.png",
};

const validBlog = {
  h1: "Hello",
  metaDescription: "A post",
  content: "<p>Body</p>",
  imageUrl: "",
  author: "Nikhil",
  isPublished: true,
  slug: "hello",
};

describe("slugSchema", () => {
  it("accepts lowercase words separated by hyphens", () => {
    expect(slugSchema.safeParse("my-post-1").success).toBe(true);
  });

  it.each(["My Post", "my_post", "-post"])("rejects %s", (slug) => {
    expect(slugSchema.safeParse(slug).success).toBe(false);
  });
});

describe("httpUrlSchema", () => {
  it("accepts an https URL", () => {
    expect(httpUrlSchema.safeParse("https://example.com").success).toBe(true);
  });

  it.each(["javascript:alert(1)", "ftp://example.com"])(
    "rejects %s",
    (url) => {
      expect(httpUrlSchema.safeParse(url).success).toBe(false);
    },
  );
});

describe("imageUrlSchema", () => {
  it("accepts a site-relative path", () => {
    expect(imageUrlSchema.safeParse("/blogs/x.png").success).toBe(true);
  });

  it("accepts a Cloudinary https URL", () => {
    expect(
      imageUrlSchema.safeParse(
        "https://res.cloudinary.com/demo/image/upload/x.png",
      ).success,
    ).toBe(true);
  });

  it("rejects a javascript URL", () => {
    expect(imageUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });
});

describe("blogCreateSchema", () => {
  it("accepts an empty imageUrl", () => {
    expect(blogCreateSchema.safeParse({ ...validBlog, imageUrl: "" }).success).toBe(
      true,
    );
  });

  it("rejects a missing h1", () => {
    expect(
      blogCreateSchema.safeParse({ ...validBlog, h1: undefined }).success,
    ).toBe(false);
  });

  it("rejects a non-boolean isPublished", () => {
    expect(
      blogCreateSchema.safeParse({ ...validBlog, isPublished: "yes" }).success,
    ).toBe(false);
  });

  it("rejects content over 200,000 characters", () => {
    expect(
      blogCreateSchema.safeParse({
        ...validBlog,
        content: "a".repeat(200_001),
      }).success,
    ).toBe(false);
  });
});

describe("projectCreateSchema", () => {
  it("accepts a valid project with a date and hidden flag", () => {
    const result = projectCreateSchema.safeParse({
      ...validProject,
      createdAt: "2025-01-31",
      hidden: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.createdAt).toBe("2025-01-31");
      expect(result.data.hidden).toBe(true);
    }
  });

  it("rejects an empty tags array", () => {
    expect(
      projectCreateSchema.safeParse({ ...validProject, tags: [] }).success,
    ).toBe(false);
  });

  it("rejects more than 20 tags", () => {
    expect(
      projectCreateSchema.safeParse({
        ...validProject,
        tags: Array.from({ length: 21 }, (_, index) => `tag-${index}`),
      }).success,
    ).toBe(false);
  });

  it("rejects a non-string tag", () => {
    expect(
      projectCreateSchema.safeParse({ ...validProject, tags: [1] }).success,
    ).toBe(false);
  });
});
