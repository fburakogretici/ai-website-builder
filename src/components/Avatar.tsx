"use client";

import { useEffect, useState } from 'react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  imageClassName?: string;
  onFallback?: () => void;
}

const DEFAULT_FALLBACK = '/default-avatar.svg';

export default function Avatar({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  imageClassName,
  onFallback,
}: AvatarProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (currentSrc === fallbackSrc) {
      onFallback?.();
      return;
    }

    setCurrentSrc(fallbackSrc);
    onFallback?.();
  };

  return (
  <div className={joinClassNames('overflow-hidden', className)}>
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onError={handleError}
        className={joinClassNames('h-full w-full object-cover', imageClassName)}
      />
    </div>
  );
}

function joinClassNames(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ');
}
