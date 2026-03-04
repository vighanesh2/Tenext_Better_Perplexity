import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Sign up</h1>
          <p className="mt-2 text-sm text-gray-400">
            Create an account to use the research assistant
          </p>
        </div>

        <div className="rounded-2xl p-[2px] bg-gradient-to-br from-white/10 via-white/5 to-black/20">
          <div className="rounded-2xl bg-[rgba(15,15,20,0.4)] backdrop-blur-md p-8 border border-white/5">
            <AuthForm mode="sign-up" />
          </div>
        </div>

        <p className="text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[#7ba3ff] hover:text-[#a3c4ff] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
