import { useState } from "react";

export function FallbackImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className={`bg-neutral-100 ${className ?? ""}`} />;
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
