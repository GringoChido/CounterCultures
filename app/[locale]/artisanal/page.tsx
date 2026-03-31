import { redirect } from "next/navigation";

interface ArtisanalPageProps {
  params: Promise<{ locale: string }>;
}

const ArtisanalPage = async ({ params }: ArtisanalPageProps) => {
  const { locale } = await params;
  redirect(`/${locale}/brands`);
};

export default ArtisanalPage;
