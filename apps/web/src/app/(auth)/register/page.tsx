import { AuthShell } from "@/components/ds";
import { SignupForm } from "@/components/signup-form";

export default function Page() {
  return (
    <AuthShell
      label="AI interview prep"
      title="Start preparing smarter."
      description="Turn any job description and company website into a focused, editable interview prep kit."
      switchPrompt="Already have an account?"
      switchLabel="Log in"
      switchHref="/login"
    >
      <SignupForm />
    </AuthShell>
  );
}
