# Email Templates

This folder stores SHUNYIN-branded email templates for Supabase Auth.

## Reset Password

File:

`reset-password.html`

Use it in Supabase Dashboard:

1. Open `Authentication`
2. Open `Email Templates`
3. Select `Reset password`
4. Replace the HTML body with the contents of `reset-password.html`

Recommended subject:

`SHUNYIN | Reset Your Password`

Notes:

- Keep `{{ .ConfirmationURL }}` in the reset password template. Supabase recovery emails use a link-based flow.
- `{{ .Email }}` and `{{ .SiteURL }}` are official Supabase template variables and are safe to use here.
