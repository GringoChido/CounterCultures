"use client";

import { usePathname } from "next/navigation";
import { ProjectListBar } from "@/app/[locale]/shop/catalog/project-list-bar";

const ProjectListGlobal = () => {
  const pathname = usePathname();
  const locale = pathname.startsWith("/es") ? "es" : "en";

  return <ProjectListBar locale={locale} />;
};

export { ProjectListGlobal };
