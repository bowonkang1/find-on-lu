import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabase";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasRecoverySession(!!session?.user);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setHasRecoverySession(true);
      } else if (!session?.user) {
        setHasRecoverySession(false);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!hasRecoverySession) {
      setError("Reset link expired. Please request a new one.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMessage("Password updated. Redirecting to sign in...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      setError(err.message || "Couldn't update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-2">
            Enter a new password for your Lawrence account
          </p>
        </div>

        {!hasRecoverySession && (
          <div className="p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm mb-4">
            Open this page from your reset email link. If the link has expired,
            request a new reset email from the sign-in page.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            required
          />

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">
              ✅ {message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !hasRecoverySession}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          <Link className="text-lu-blue-600 hover:text-lu-blue-700" to="/login">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
