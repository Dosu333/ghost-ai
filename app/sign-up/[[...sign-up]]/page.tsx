import { SignUp } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth/auth-shell"
import { clerkAuthPaths } from "@/lib/clerk"

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your Ghost AI workspace."
      description="Start with protected project access, invite collaborators later, and keep every architecture session tied to a real authenticated identity."
      form={
        <SignUp
          path={clerkAuthPaths.signUp}
          signInUrl={clerkAuthPaths.signIn}
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
