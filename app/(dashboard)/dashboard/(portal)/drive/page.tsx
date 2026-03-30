"use client";

import { Folder, Image, FileText, FileSpreadsheet, Palette, Briefcase, FileSignature, LayoutTemplate, Search } from "lucide-react";

interface DriveFolder {
  id: string;
  name: string;
  fileCount: number;
  lastModified: string;
  icon: React.ElementType;
  color: string;
}

const folders: DriveFolder[] = [
  {
    id: "1",
    name: "Brand Assets",
    fileCount: 34,
    lastModified: "Mar 28, 2026",
    icon: Palette,
    color: "bg-brand-copper/10 text-brand-copper",
  },
  {
    id: "2",
    name: "Product Photos",
    fileCount: 156,
    lastModified: "Mar 27, 2026",
    icon: Image,
    color: "bg-pink-50 text-pink-600",
  },
  {
    id: "3",
    name: "Spec Sheets",
    fileCount: 28,
    lastModified: "Mar 25, 2026",
    icon: FileSpreadsheet,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "4",
    name: "Marketing Materials",
    fileCount: 67,
    lastModified: "Mar 24, 2026",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: "5",
    name: "Client Projects",
    fileCount: 42,
    lastModified: "Mar 22, 2026",
    icon: Briefcase,
    color: "bg-amber-50 text-amber-600",
  },
  {
    id: "6",
    name: "Proposals",
    fileCount: 19,
    lastModified: "Mar 20, 2026",
    icon: FileText,
    color: "bg-purple-50 text-purple-600",
  },
  {
    id: "7",
    name: "Contracts",
    fileCount: 12,
    lastModified: "Mar 18, 2026",
    icon: FileSignature,
    color: "bg-red-50 text-red-600",
  },
  {
    id: "8",
    name: "Templates",
    fileCount: 23,
    lastModified: "Mar 15, 2026",
    icon: LayoutTemplate,
    color: "bg-brand-sage/10 text-brand-sage",
  },
];

const recentFiles = [
  { name: "Spring_Collection_Lookbook.pdf", folder: "Marketing Materials", size: "4.2 MB", modified: "Mar 28" },
  { name: "CC-OVB-18_Spec.pdf", folder: "Spec Sheets", size: "1.1 MB", modified: "Mar 27" },
  { name: "Trade_Program_Brochure_v3.pdf", folder: "Marketing Materials", size: "8.5 MB", modified: "Mar 26" },
  { name: "Copper_Basin_Hero_Shot.jpg", folder: "Product Photos", size: "12.3 MB", modified: "Mar 25" },
  { name: "Logo_Primary_Copper.svg", folder: "Brand Assets", size: "24 KB", modified: "Mar 24" },
];

const DrivePage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dash-text">Drive</h2>
          <p className="text-sm text-dash-text-secondary mt-1">Manage your digital assets and files</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dash-text-secondary" />
          <input
            type="text"
            placeholder="Search files..."
            className="pl-9 pr-4 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-copper/30 focus:border-brand-copper w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {folders.map((folder) => {
          const Icon = folder.icon;
          return (
            <div
              key={folder.id}
              className="bg-dash-surface rounded-xl border border-dash-border p-5 hover:border-brand-copper/30 hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className={`w-11 h-11 rounded-xl ${folder.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-dash-text group-hover:text-brand-copper transition-colors">{folder.name}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-dash-text-secondary">{folder.fileCount} files</span>
                <span className="text-[10px] text-dash-text-secondary">{folder.lastModified}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border">
        <div className="p-5 border-b border-dash-border">
          <h3 className="text-sm font-semibold text-dash-text">Recent Files</h3>
        </div>
        <div className="divide-y divide-dash-border">
          {recentFiles.map((file) => (
            <div key={file.name} className="flex items-center justify-between px-5 py-3 hover:bg-dash-bg/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Folder className="w-4 h-4 text-dash-text-secondary" />
                <div>
                  <p className="text-sm font-medium text-dash-text">{file.name}</p>
                  <p className="text-xs text-dash-text-secondary">{file.folder}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-xs text-dash-text-secondary">{file.size}</span>
                <span className="text-xs text-dash-text-secondary">{file.modified}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-dash-surface rounded-xl border border-dash-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-dash-text">Storage Usage</h3>
            <p className="text-xs text-dash-text-secondary mt-0.5">2.4 GB of 15 GB used</p>
          </div>
          <span className="text-xs font-medium text-brand-copper">16% used</span>
        </div>
        <div className="w-full bg-dash-bg rounded-full h-2 mt-3">
          <div className="bg-brand-copper h-2 rounded-full" style={{ width: "16%" }} />
        </div>
      </div>
    </div>
  );
};

export default DrivePage;
