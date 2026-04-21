import { FileListing } from "@/app/(dashboard)/components/drive/file-listing";

const SharedPage = () => (
  <FileListing
    title="Shared with me"
    endpoint="/api/dashboard/drive-home?action=shared"
    sectionLabel="Files shared with you"
    emptyLabel="Nothing has been shared with you yet"
  />
);

export default SharedPage;
