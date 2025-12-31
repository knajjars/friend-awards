"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { User } from "lucide-react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <div>
          <input
            className="auth-input-field"
            type="email"
            name="email"
            placeholder="Email"
            required
          />
        </div>
        <div>
          <input
            className="auth-input-field"
            type="password"
            name="password"
            placeholder="Password"
            required
          />
        </div>
        <button className="auth-button" type="submit" disabled={submitting}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner h-4 w-4" />
              {flow === "signIn" ? "Signing in..." : "Creating account..."}
            </span>
          ) : flow === "signIn" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </button>

        <div className="text-center text-sm text-slate-400">
          <span>{flow === "signIn" ? "Don't have an account? " : "Already have an account? "}</span>
          <button
            type="button"
            className="cursor-pointer font-medium text-gold-400 transition-colors hover:text-gold-300 hover:underline"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </form>

      <div className="my-5 flex items-center justify-center">
        <hr className="flex-1 border-navy-600" />
        <span className="mx-4 text-sm text-slate-500">or continue with</span>
        <hr className="flex-1 border-navy-600" />
      </div>

      <button
        className="btn-secondary flex w-full items-center justify-center gap-2"
        onClick={() => void signIn("anonymous")}
      >
        <User className="h-5 w-5" />
        Guest access
      </button>
    </div>
  );
}
