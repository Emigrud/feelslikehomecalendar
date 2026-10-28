import { cn } from "@/lib/utils";

export function CommentMark({ className }: { className?: string }) {
  return (
    <span aria-label="Comment added" className={cn("inline-flex h-4 w-4 items-center justify-center rounded-full border border-comment-border bg-comment text-[10px] font-bold leading-none text-comment-foreground", className)}>
      C
    </span>
  );
}
