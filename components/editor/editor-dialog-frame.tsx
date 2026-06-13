import * as React from "react"

import { cn } from "@/lib/utils"

interface EditorDialogFrameProps extends React.ComponentProps<"section"> {
  title: string
  description?: string
  footer?: React.ReactNode
  children?: React.ReactNode
  contentClassName?: string
}

export function EditorDialogFrame({
  title,
  description,
  footer,
  children,
  contentClassName,
  className,
  ...props
}: EditorDialogFrameProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-surface-border bg-elevated text-copy-primary shadow-2xl shadow-black/20",
        className
      )}
      {...props}
    >
      <div className="space-y-2 border-b border-surface-border px-6 py-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-copy-muted">
            {description}
          </p>
        ) : null}
      </div>

      {children ? (
        <div className={cn("px-6 py-5", contentClassName)}>{children}</div>
      ) : null}

      {footer ? (
        <div className="flex flex-col-reverse gap-3 border-t border-surface-border bg-surface/80 px-6 py-4 sm:flex-row sm:justify-end">
          {footer}
        </div>
      ) : null}
    </section>
  )
}
