import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);
const isAdminRoute = createRouteMatcher([
  "/dashboard/inventory(.*)",
  "/dashboard/stores(.*)",
  "/dashboard/sales(.*)",
  "/dashboard/payroll(.*)",
  "/dashboard/reports(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
