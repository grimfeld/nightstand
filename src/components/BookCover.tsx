import { cn } from "@/lib/utils";

/** Covers are what make the Nightstand glanceable, so the fallback still has to
 *  read as a book rather than a broken image. */
export function BookCover({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const base = "shrink-0 overflow-hidden rounded-sm bg-muted shadow-sm ring-1 ring-border";

  if (!url) {
    return (
      <div className={cn(base, "grid place-items-center p-1", className)}>
        <span className="line-clamp-3 text-center text-[9px] leading-tight font-medium text-muted-foreground">
          {title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      className={cn(base, "object-cover", className)}
    />
  );
}
