import { dark } from "@clerk/ui/themes"

function normalizeClerkPath(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  try {
    const url = value.startsWith("http")
      ? new URL(value)
      : new URL(value, "http://localhost")
    const pathname = url.pathname.replace(/\/+$/, "")

    return pathname || fallback
  } catch {
    return fallback
  }
}

function toRouteMatcher(pathname: string) {
  if (pathname === "/") {
    return pathname
  }

  return `${pathname}(.*)`
}

export const clerkAuthPaths = {
  signIn: normalizeClerkPath(
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    "/sign-in"
  ),
  signUp: normalizeClerkPath(
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    "/sign-up"
  ),
  editor: "/editor",
}

export const clerkPublicRouteMatchers = [
  toRouteMatcher(clerkAuthPaths.signIn),
  toRouteMatcher(clerkAuthPaths.signUp),
]

export const clerkAppearance = {
  theme: dark,
  variables: {
    colorPrimary: "var(--accent-primary)",
    colorBackground: "var(--bg-surface)",
    colorInputBackground: "var(--bg-elevated)",
    colorInputText: "var(--text-primary)",
    colorText: "var(--text-primary)",
    colorTextSecondary: "var(--text-secondary)",
    colorNeutral: "var(--border-subtle)",
    colorDanger: "var(--state-error)",
    colorSuccess: "var(--state-success)",
    borderRadius: "1rem",
    fontFamily: "var(--font-geist-sans)",
  },
} as const
