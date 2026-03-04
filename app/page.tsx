import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatClient from "@/components/chat/ChatClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <ChatClient />
    </div>
  );
}
