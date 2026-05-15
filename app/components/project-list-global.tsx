"use client";

import { usePathname } from "next/navigation";
import { ProjectListBar } from "@/app/[locale]/shop/catalog/project-list-bar";

const ProjectListGlobal = () => {
  const pathname = usePathname();
  const locale = pathname.startsWith("/es") ? "es" : "en";
  const isHome = pathname === "/en" || pathname === "/es" || pathname === "/";

  return (
    <ProjectListBar
      locale={locale}
      revealTriggerSelector={isHome ? "#cc-spec-fab-trigger" : undefined}
    />
  );
};

export { ProjectListGlobal };
