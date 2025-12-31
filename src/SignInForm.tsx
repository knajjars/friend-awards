"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

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
        <button 
          className="auth-button" 
          type="submit" 
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="spinner w-4 h-4" />
              {flow === "signIn" ? "Signing in..." : "Creating account..."}
            </span>
          ) : (
            flow === "signIn" ? "Sign in" : "Create account"
          )}
        </button>
        
        <div className="text-center text-sm text-slate-400">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-gold-400 hover:text-gold-300 hover:underline font-medium cursor-pointer transition-colors"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </form>
      
      <div className="flex items-center justify-center my-5">
        <hr className="flex-1 border-navy-600" />
        <span className="mx-4 text-slate-500 text-sm">or continue with</span>
        <hr className="flex-1 border-navy-600" />
      </div>
      
      <button 
        className="btn-secondary w-full flex items-center justify-center gap-2"
        onClick={() => void signIn("anonymous")}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Guest access
      </button>
    </div>
  );
}
