import { redirect } from "next/navigation";

interface BlogPostPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// /blog has been consolidated into /insights. Send historical post links
// to the new editorial home; the article itself can be re-published there.
const BlogPostPage = async ({ params }: BlogPostPageProps) => {
  const { locale } = await params;
  redirect(`/${locale}/insights`);
};

export default BlogPostPage;
