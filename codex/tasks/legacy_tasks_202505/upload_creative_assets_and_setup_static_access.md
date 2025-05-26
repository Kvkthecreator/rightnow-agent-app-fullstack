upload_creative_assets_and_setup_static_access.md
📄 Task Title

Upload Creative Assets and Set Up Static Access Paths

🎯 Goal

Organize and upload creative assets (e.g. logos, product images, icons) for the rightNOW service into the monorepo and make them available for usage in React components across the app.

Ensure:

Assets are stored under a predictable and scalable folder structure
Static imports are supported using Next.js built-in image optimization
Default logo usage can be embedded into the layout or components
🧠 Prompt to Codex

### Step 1: Asset Folder Setup
Create a directory inside the web app:
- `/web/public/assets/`
- Inside that, create:
  - `/web/public/assets/logos/`
  - `/web/public/assets/images/`

This structure supports:
- `/assets/logos/rightnow-logo-dark.png`
- `/assets/images/landing-hero.png`, etc.

All files placed here are available via static URLs like:
- `/assets/logos/rightnow-logo-dark.png`

---

### Step 2: Logo Component
Create a reusable logo component in:
- `/web/components/Logo.tsx`

This component:
- Uses `next/image` to optimize loading
- Accepts optional props:
  - `variant` (e.g. "dark" | "light")
  - `width`, `height`

Example usage:
```tsx
<Logo variant="dark" width={120} height={40} />
Default image path should point to:

/assets/logos/rightnow-logo-dark.png
Use next/image import:

import Image from 'next/image';
Step 3: Update Navbar Placeholder
Update the existing navbar (in /index/page.tsx or layout) to replace <div className="logo-placeholder" /> with:

<Logo variant="dark" />
Step 4: README Reference (Optional)
In /web/README.md, document:

Where to put new image assets
How to import them (e.g. via /assets/... URL or using next/image)

---

## ✅ Completion Checklist
- [ ] `/public/assets/logos/` and `/public/assets/images/` folders created
- [ ] Logo component created and supports variants
- [ ] Landing page and layout updated to use real logo
- [ ] Static image paths tested in browser (e.g. `/assets/logos/rightnow-logo-dark.png`)
- [ ] Optional usage instructions documented in `README.md`

---