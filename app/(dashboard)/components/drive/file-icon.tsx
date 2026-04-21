import {
  Folder,
  FileText,
  Table,
  Presentation,
  Image as ImageIcon,
  Film,
  File,
} from "lucide-react";

interface IconSpec {
  Icon: typeof File;
  color: string;
}

const byMime = (mimeType: string): IconSpec => {
  if (mimeType === "application/vnd.google-apps.folder")
    return { Icon: Folder, color: "#e4b74b" };
  if (mimeType === "application/vnd.google-apps.document")
    return { Icon: FileText, color: "#4285f4" };
  if (mimeType === "application/vnd.google-apps.spreadsheet")
    return { Icon: Table, color: "#34a853" };
  if (mimeType === "application/vnd.google-apps.presentation")
    return { Icon: Presentation, color: "#fbbc05" };
  if (mimeType === "application/pdf") return { Icon: FileText, color: "#ea4335" };
  if (mimeType.startsWith("image/"))
    return { Icon: ImageIcon, color: "#aa00ff" };
  if (mimeType.startsWith("video/")) return { Icon: Film, color: "#ff6d00" };
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return { Icon: Table, color: "#185abc" };
  if (mimeType.includes("document") || mimeType.includes("word"))
    return { Icon: FileText, color: "#185abc" };
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return { Icon: Presentation, color: "#185abc" };
  return { Icon: File, color: "#8C857C" };
};

interface FileIconProps {
  mimeType: string;
  size?: number;
  className?: string;
}

export const FileIcon = ({ mimeType, size = 20, className }: FileIconProps) => {
  const { Icon, color } = byMime(mimeType);
  return <Icon size={size} color={color} className={className} />;
};
