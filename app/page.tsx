import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { clerkAuthPaths } from "@/lib/clerk"

export default async function Home() {
  const { isAuthenticated } = await auth()

  if (isAuthenticated) {
    redirect(clerkAuthPaths.editor)
  }

  redirect(clerkAuthPaths.signIn)
}
