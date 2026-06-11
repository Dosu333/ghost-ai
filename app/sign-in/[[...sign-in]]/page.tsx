import { SignIn } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth/auth-shell"
import { clerkAuthFormAppearance, clerkAuthPaths } from "@/lib/clerk"

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in to your architecture workspace."
      description="Access your protected projects, collaborate in real time, and continue shaping technical specs from a single shared canvas."
      form={
        <SignIn
          path={clerkAuthPaths.signIn}
          signUpUrl={clerkAuthPaths.signUp}
          appearance={clerkAuthFormAppearance}
        />
      }
    />
  )
}
