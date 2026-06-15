"use client";

import { useState } from "react";
import Image from "next/image";

interface AvatarProps {
  src: string | null;
  alt: string;
  initials: string;
  size: number;
  className?: string;
  textClassName?: string;
}

export default function Avatar({ src, alt, initials, size, className = "", textClassName = "text-xs" }: AvatarProps) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex shrink-0 items-center justify-center rounded-full bg-panel-hover font-semibold text-ink ${textClassName} ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full object-cover ${className}`}
      onError={() => setErrored(true)}
    />
  );
}
