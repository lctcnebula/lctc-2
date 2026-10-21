import type { Metadata } from "next";
import BlogPost from "@/components/BlogPost";
import { seed } from "@/lib/seed";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = seed.posts.find(x => x.slug === slug);
  return p ? { title: p.title, description: p.excerpt } : { title: "Blog" };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  return <BlogPost slug={slug} />;
}
