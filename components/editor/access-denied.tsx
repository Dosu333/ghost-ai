import Link from "next/link"
import { Lock } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AccessDenied() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-6 text-copy-primary">
      <section className="flex w-full max-w-md flex-col items-center rounded-3xl border border-surface-border bg-surface/90 px-8 py-10 text-center shadow-2xl shadow-black/30 backdrop-blur-md">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-surface-border bg-elevated text-brand">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Access denied
        </h1>
        <p className="mt-3 text-sm leading-6 text-copy-secondary">
          This workspace is unavailable or you do not have permission to open it.
        </p>
        <Link
          href="/editor"
          className={cn(buttonVariants(), "mt-8 rounded-xl px-5")}
        >
          Back to projects
        </Link>
      </section>
    </main>
  )
}
