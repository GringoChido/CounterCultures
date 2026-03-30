import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const Card = ({ children, className = "", hover = false }: CardProps) => (
  <div
    className={`bg-white rounded-sm overflow-hidden ${
      hover
        ? "transition-shadow duration-300 hover:shadow-lg"
        : ""
    } ${className}`}
  >
    {children}
  </div>
);

interface CardImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "square" | "video" | "portrait" | "wide";
}

const aspectStyles = {
  square: "aspect-square",
  video: "aspect-video",
  portrait: "aspect-[3/4]",
  wide: "aspect-[16/9]",
};

const CardImage = ({
  src,
  alt,
  className = "",
  aspectRatio = "video",
}: CardImageProps) => (
  <div className={`overflow-hidden ${aspectStyles[aspectRatio]}`}>
    <img
      src={src}
      alt={alt}
      className={`w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-105 ${className}`}
    />
  </div>
);

const CardContent = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => <div className={`p-6 ${className}`}>{children}</div>;

export { Card, CardImage, CardContent };
