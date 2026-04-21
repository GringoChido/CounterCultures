import { FileListing } from "@/app/(dashboard)/components/drive/file-listing";

const SharedDrivesPage = () => (
  <FileListing
    title="Shared drives"
    endpoint="/api/dashboard/drive-home?action=shared-drives"
    sectionLabel="Drives you can access"
    emptyLabel="You're not a member of any shared drives"
  />
);

export default SharedDrivesPage;
