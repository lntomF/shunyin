# Email Templates

This folder stores SHUNYIN-branded bilingual email templates for Supabase Auth.

## Reset Password

File:

`reset-password.html`

Use it in Supabase Dashboard:

1. Open `Authentication`
2. Open `Email Templates`
3. Select `Reset password`
4. Replace the HTML body with the contents of `reset-password.html`

Recommended subject:

`SHUNYIN | Reset Your Password / 重置密码`

Notes:

- Keep `{{ .ConfirmationURL }}` in the reset password template. Supabase recovery emails use a link-based flow.
- `{{ .Email }}` and `{{ .SiteURL }}` are official Supabase template variables and are safe to use here.

## Confirm Signup

File:

`confirm-signup-otp.html`

Use it in Supabase Dashboard:

1. Open `Authentication`
2. Open `Email Templates`
3. Select `Confirm signup`
4. Replace the HTML body with the contents of `confirm-signup-otp.html`

Recommended subject:

`SHUNYIN | Your Signup Verification Code / 注册验证码`

Notes:

- For signup OTP, use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.
- This matches the app flow where signup is verified with a one-time code, while later sign-in uses email + password.
- Both templates are now bilingual, with Chinese first and English second.
