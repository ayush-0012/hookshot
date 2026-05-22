import { SignIn } from "@clerk/nextjs";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-4">
      <SignIn routing="hash" />
    </div>
  );
}
