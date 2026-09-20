import { AuthShell } from "@/components/ds"
import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    <AuthShell
      label="AI interview prep"
      title="Pick up where you left off."
      description="Your prep kits, questions and schedules are right where you left them."
      switchPrompt="New to PrepSync?"
      switchLabel="Create an account"
      switchHref="/register"
    >
      <LoginForm />
    </AuthShell>
  )
}
