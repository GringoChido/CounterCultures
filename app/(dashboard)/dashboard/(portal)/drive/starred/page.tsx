import { FileListing } from "@/app/(dashboard)/components/drive/file-listing";

const StarredPage = () => (
  <FileListing
    title="Starred"
    endpoint="/api/dashboard/drive-home?action=starred"
    sectionLabel="Starred files"
    emptyLabel="Star files in Drive to see them here"
  />
);

export default StarredPage;
