import { useState } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

/** Covers are what make the Nightstand glanceable, so the fallback still has to
 *  read as a book rather than a broken image — including when the cover URL
 *  exists but fails to load, which Open Library does a lot. When `onPhoto` is
 *  given the cover doubles as a picker — on mobile that means the camera or
 *  gallery. */
export function BookCover({
  url,
  title,
  className,
  onPhoto,
}: {
  url: string;
  title: string;
  className?: string;
  onPhoto?: (file: File) => void;
}) {
  // Tracking the URL rather than a boolean means a *new* cover (a retaken
  // photo, a different edition) gets a fresh chance to load.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(url) && url !== failedUrl;

  const base = "shrink-0 overflow-hidden rounded-sm bg-muted shadow-sm ring-1 ring-border";
  const onError = () => setFailedUrl(url);

  const body = showImage ? (
    <img src={url} alt="" loading="lazy" onError={onError} className="h-full w-full object-cover" />
  ) : (
    <span className="line-clamp-3 text-center text-[9px] leading-tight font-medium text-muted-foreground">
      {title}
    </span>
  );

  if (!onPhoto) {
    return showImage ? (
      <img
        src={url}
        alt=""
        loading="lazy"
        onError={onError}
        className={cn(base, "object-cover", className)}
      />
    ) : (
      <div className={cn(base, "grid place-items-center p-1", className)}>{body}</div>
    );
  }

  return (
    <label
      className={cn(
        base,
        "relative grid cursor-pointer place-items-center",
        !showImage && "p-1",
        className,
      )}
    >
      {body}
      <span className="absolute right-0.5 bottom-0.5 grid place-items-center rounded-full bg-background/80 p-0.5">
        <Camera className="size-3 text-muted-foreground" />
      </span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPhoto(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
