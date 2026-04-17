import { redirect } from "next/navigation";

const DashboardPage = () => {
  redirect("/dashboard/overview");
};

export default DashboardPage;
