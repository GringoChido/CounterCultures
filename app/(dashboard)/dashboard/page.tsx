import { redirect } from "next/navigation";

const DashboardPage = () => {
  redirect("/dashboard/login");
};

export default DashboardPage;
