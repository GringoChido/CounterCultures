import { redirect } from "next/navigation";

interface ReturnsPageProps {
  params: Promise<{ locale: string }>;
}

const ReturnsPage = async ({ params }: ReturnsPageProps) => {
  const { locale } = await params;
  redirect(`/${locale}/returns-warranty`);
};

export default ReturnsPage;
