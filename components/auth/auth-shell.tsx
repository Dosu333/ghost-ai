import type { ReactNode } from "react"

interface AuthShellProps {
  title: string
  description: string
  form: ReactNode
}

const featureList = [
  "Protected project workspaces",
  "Real-time collaboration access",
  "AI-assisted system design sessions",
]

export function AuthShell({ title, description, form }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-base text-copy-primary">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="hidden pr-12 lg:block">
          <div className="max-w-md space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-xl border border-surface-border bg-surface px-3 py-1.5 text-sm text-copy-secondary">
                Ghost AI
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight text-copy-primary">
                  {title}
                </h1>
                <p className="text-base leading-7 text-copy-secondary">
                  {description}
                </p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-copy-secondary">
              {featureList.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-surface-border bg-surface/80 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center lg:min-h-0">
          <div className="w-full max-w-md rounded-3xl border border-surface-border bg-surface/92 p-3 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-4">
            {form}
          </div>
        </section>
      </div>
    </main>
  )
}
