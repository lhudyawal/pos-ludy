import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "./supabase";

export type UserRole = "admin" | "sales" | null;

export async function getCurrentUserRole(): Promise<UserRole> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("clerk_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role as UserRole;
  } catch {
    return null;
  }
}

export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "admin";
}

export async function isSales(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "sales";
}

export async function hasAccess(requiredRole: "admin" | "sales"): Promise<boolean> {
  const role = await getCurrentUserRole();
  
  if (!role) return false;
  
  if (requiredRole === "admin") {
    return role === "admin";
  }
  
  return role === "admin" || role === "sales";
}
