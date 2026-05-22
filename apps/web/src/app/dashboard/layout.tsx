import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-end items-center p-4 gap-4 h-16 border-b border-zinc-800">
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton>
            <button className="bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
              Sign Up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
