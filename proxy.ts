import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

import { clerkPublicRouteMatchers } from "@/lib/clerk"

const isPublicRoute = createRouteMatcher(clerkPublicRouteMatchers)

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return
  }

  await auth.protect()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|mjs|png|jpg|jpeg|gif|svg|webp|ico|ttf|woff2?|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
