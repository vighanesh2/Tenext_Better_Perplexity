import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WorkspaceLayout from "@/components/WorkspaceLayout";

export const dynamic = "force-dynamic";

export default async function Home() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server configuration error";
    if (message.includes("Missing Supabase env") || message.includes("NEXT_PUBLIC_SUPABASE")) {
      throw new Error(
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel (Settings → Environment Variables), then redeploy."
      );
    }
    throw err;
  }

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <WorkspaceLayout />
    </div>
  );
}
