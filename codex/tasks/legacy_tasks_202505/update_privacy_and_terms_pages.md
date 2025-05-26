update_privacy_and_terms_pages.md
## 📄 Task Title


---

## 🎯 Goal
Create basic static pages under `/privacy` and `/terms` that render legal copy (Privacy Policy and Terms of Service) for the rightNOW app.
Ensure:
- Pages use the Shell layout and are styled minimally
- Copy content is updated from HelpMeAI → rightNOW
- No navigation logic is required unless specified later

---

## 🧠 Prompt to Codex
```
Create two new pages:

### 1. /privacy (web/app/privacy/page.tsx)
- Use Shell layout
- Page title: "Privacy Policy"
- Render static content (see below)
- Use `<div className="prose max-w-3xl mx-auto p-6">` wrapper for readability

### 2. /terms (web/app/terms/page.tsx)
- Use Shell layout
- Page title: "Terms of Service"
- Same styling wrapper as above

### Content:
Replace any occurrence of "HelpMeAI" with "rightNOW"
Replace contact email with: contactus@rgtnow.com
Keep links to Google OAuth permission page intact

### Optional UI:
- No sidebar nav links needed unless otherwise requested
- Optionally add a `<h1>` heading per page with `text-2xl font-bold`
- No need for back button unless requested

### 📄 Privacy Policy Content (trimmed and rebranded)
---
**Effective Date: March 25th, 2025**

This Privacy Policy outlines how rightNOW ("we", "our", or "us") accesses, uses, and protects your information when you authorize the application to connect with your Google account.

**1. Information We Access**
We may access:
- Your Google account email address
- Permission to send emails on your behalf
- (Optional) Permission to read specific emails
We do not store email content or credentials. All access is temporary and tied to your explicit Google OAuth consent.

**2. How We Use Your Data**
Only to:
- Send emails via your Gmail account
- Read inbox content if you enable features like summaries or auto replies
We do not store or share your Gmail content.

**3. How to Revoke Access**
Visit 👉 https://myaccount.google.com/permissions
Revoking disables Gmail-related features in rightNOW.

**4. Data Security**
We use OAuth2 and do not store credentials or Gmail data. All communication with Google APIs is encrypted.

**5. Contact Us**
📧 contactus@rgtnow.com

---

### 📄 Terms of Service Content
---
**Effective Date: March 28th, 2025**

Welcome to rightNOW. By using our app or site, you agree to these Terms of Service. If you disagree, do not use the services.

**1. Use of Services**
You must:
- Be 18+ years old
- Use the service lawfully
- Authorize secure OAuth access to Gmail when required

**2. User Data & Gmail Access**
We may request access to:
- Your email address
- Send emails on your behalf
- (Optionally) Read inbox content
We don’t store Gmail content. Access can be revoked at https://myaccount.google.com/permissions.

**3. Restrictions**
You may not:
- Send spam
- Disrupt or reverse-engineer the platform
- Violate laws or third-party rights
Violations may result in suspension.

**4. Modifications**
We may update these terms and notify you if changes are material. Continued use means acceptance.

**5. Termination**
We may suspend or terminate access for violating these terms.

**6. Disclaimers**
rightNOW is provided "as is" with no warranties. We do our best to ensure reliability but offer no uptime guarantees.

**7. Contact**
📧 contactus@rgtnow.com
```

---

## ✅ Completion Checklist
- [ ] /privacy and /terms routes render readable legal pages
- [ ] Uses Shell layout but avoids unnecessary navigation links
- [ ] Legal copy updated to reflect rightNOW and contact info
- [ ] Code is clean, deployable, and matches shadcn styling
