import { FileListing } from "@/app/(dashboard)/components/drive/file-listing";

const MyDrivePage = () => (
  <FileListing
    title="My Drive"
    endpoint="/api/dashboard/drive-home?action=my-drive"
    sectionLabel="Files in your Drive"
    emptyLabel="Your Drive is empty"
  />
);

export default MyDrivePage;
