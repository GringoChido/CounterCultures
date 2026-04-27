import { redirect } from "next/navigation";

interface BlogPageProps {
  params: Promise<{ locale: string }>;
}

// /blog has been consolidated into /insights — single editorial home.
// Preserves SEO continuity for any historical inbound /blog links.
const BlogPage = async ({ params }: BlogPageProps) => {
  const { locale } = await params;
  redirect(`/${locale}/insights`);
};

export default BlogPage;
