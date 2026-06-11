import { SignUp } from "@clerk/nextjs"

import { AuthShell } from "@/components/auth/auth-shell"
import { clerkAuthFormAppearance, clerkAuthPaths } from "@/lib/clerk"

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your Ghost AI workspace."
      description="Start with protected project access, invite collaborators later, and keep every architecture session tied to a real authenticated identity."
      form={
        <SignUp
          path={clerkAuthPaths.signUp}
          signInUrl={clerkAuthPaths.signIn}
          appearance={clerkAuthFormAppearance}
        />
      }
    />
  )
}
