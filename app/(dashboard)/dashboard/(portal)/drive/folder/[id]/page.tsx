import { FolderView } from "@/app/(dashboard)/components/drive/folder-view";

interface FolderPageProps {
  params: Promise<{ id: string }>;
}

const FolderPage = async ({ params }: FolderPageProps) => {
  const { id } = await params;
  return <FolderView folderId={id} />;
};

export default FolderPage;
