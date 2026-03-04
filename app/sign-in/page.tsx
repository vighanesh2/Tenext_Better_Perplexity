import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to access the research assistant
          </p>
        </div>

        <div className="rounded-2xl p-[2px] bg-gradient-to-br from-white/10 via-white/5 to-black/20">
          <div className="rounded-2xl bg-[rgba(15,15,20,0.4)] backdrop-blur-md p-8 border border-white/5">
            <AuthForm mode="sign-in" />
          </div>
        </div>

        <p className="text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-[#7ba3ff] hover:text-[#a3c4ff] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
