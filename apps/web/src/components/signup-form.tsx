"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { derivePasswordProof } from "@/lib/passwordProof";
import { ErrorBanner } from "@/components/ErrorBanner";
import { track } from "@/lib/analytics";
import { Field, FormDivider, GoogleMark, Label, PrimaryButton, SecondaryButton, inputClass } from "@/components/ds";

export function SignupForm({ ...props }: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error")) {
      setError("Google sign-in failed. Please try again.")
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: name.trim() || email.split("@")[0],
        email,
        password: await derivePasswordProof(email, password),
      })
      if (signUpError) {
        setError(signUpError.message ?? "Failed to register")
        return
      }
      track("signup_completed", { method: "email" })
      router.push("/dashboard")
    } catch {
      setError("Failed to register")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    track("google_auth_clicked", { page: "signup" })
    try {
      const { error: googleError } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        newUserCallbackURL: "/dashboard",
        errorCallbackURL: "/register",
      })
      if (googleError) {
        setError(googleError.message ?? "Google sign-in failed")
      }
    } catch {
      setError("Google sign-in failed")
    }
  }

  return (
    <div {...props}>
      <Label className="text-ink-soft">Sign up</Label>
      <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-ink">Create your account.</h2>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <Field label="Full name" htmlFor="name">
          <input
            id="name"
            type="text"
            placeholder="Jane Doe"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>

        <PrimaryButton type="submit" disabled={submitting} arrow={!submitting} className="w-full">
          {submitting ? "Creating account..." : "Create account"}
        </PrimaryButton>
      </form>

      <FormDivider />

      <SecondaryButton type="button" onClick={handleGoogle} className="w-full">
        <GoogleMark />
        Sign up with Google
      </SecondaryButton>
    </div>
  )
}
