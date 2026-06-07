import { SignIn } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth/auth-shell"
import { clerkAuthPaths } from "@/lib/clerk"

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in to your architecture workspace."
      description="Access your protected projects, collaborate in real time, and continue shaping technical specs from a single shared canvas."
      form={
        <SignIn
          path={clerkAuthPaths.signIn}
          signUpUrl={clerkAuthPaths.signUp}
          appearance={{
            elements: {
              card: "bg-transparent shadow-none",
              rootBox: "w-full",
              headerTitle: "text-copy-primary",
              headerSubtitle: "text-copy-secondary",
              socialButtonsBlockButton:
                "border-surface-border bg-elevated text-copy-primary hover:bg-subtle",
              formFieldInput:
                "border-surface-border bg-elevated text-copy-primary",
              formButtonPrimary:
                "bg-brand text-base hover:bg-brand/80",
              footerActionLink: "text-brand hover:text-brand/80",
              identityPreviewEditButton:
                "text-copy-secondary hover:text-copy-primary",
            },
          }}
        />
      }
    />
  )
}
