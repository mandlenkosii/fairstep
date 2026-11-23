/**
 * Turns Supabase Auth errors into plain-language messages.
 * Unknown errors get a generic message, so nothing technical leaks to the screen.
 */

const MESSAGES: Record<string, string> = {
  invalid_credentials: "That email and password don't match. Check them and try again.",
  user_already_exists: "There's already an account with this email. Log in instead.",
  email_exists: "There's already an account with this email. Log in instead.",
  over_request_rate_limit: "Too many attempts. Wait a minute, then try again.",
  over_email_send_rate_limit: "Too many attempts. Wait a minute, then try again.",
  weak_password: "Choose a stronger password: at least 8 characters, not a common one.",
  email_not_confirmed: "Confirm your email address first, using the link we sent you.",
  user_banned: "This account has been suspended. Contact FairStep support.",
};

const FALLBACK = "Something went wrong on our side. Please try again.";

export function authErrorMessage(error: { code?: string; message?: string }): string {
  return (error.code && MESSAGES[error.code]) || FALLBACK;
}
