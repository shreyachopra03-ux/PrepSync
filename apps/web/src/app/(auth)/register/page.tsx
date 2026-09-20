import { SignupForm } from "@/components/signup-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <SignupForm />
      </div>
    </div>
  )
}
