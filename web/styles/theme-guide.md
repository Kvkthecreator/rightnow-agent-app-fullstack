# 🎨 Theme Guide

**Design system powered by [shadcn/ui](https://ui.shadcn.com) — all color classes map to CSS variables defined in :root and .dark. Use ONLY these variable-based classes.**

---

## 🟣 Border Radius

- Inputs & Buttons: `rounded-lg` (`0.75rem`)
- Cards & Modals: `rounded-2xl` (`1.5rem`)

## 🎨 Colors

- All color classes use Tailwind utilities mapped to CSS variables:
    - Background: `bg-background`
    - Foreground/Text: `text-foreground`
    - Card: `bg-card` / `text-card-foreground`
    - Popover: `bg-popover` / `text-popover-foreground`
    - Primary (buttons, highlights): `bg-primary` / `text-primary-foreground`
    - Secondary: `bg-secondary` / `text-secondary-foreground`
    - Muted: `bg-muted` / `text-muted-foreground`
    - Accent: `bg-accent` / `text-accent-foreground`
    - Destructive: `bg-destructive`
    - Borders: `border`, `border-border`
    - Inputs: `bg-input` / `border-input`
    - Rings (focus): `ring`, `ring-ring`

> ⚠️ **Do not use Tailwind default palette classes like `bg-white`, `bg-slate-900`, etc. Always use the variable-based classes above.**

## 🖼️ Shadows

- Inputs & Cards: `shadow-sm`
- Modals & Overlays: `shadow-md`

## 🔠 Typography

- Font: `Inter`, sans-serif (set via Tailwind config)
- Headings: `text-xl font-semibold`
- Body Text: `text-base`
- Muted Text: `text-sm text-muted-foreground`

## 📐 Spacing

- Section/Card Padding: `p-6` or `p-10`
- Input Groups: `space-y-4`
- Form Layouts: `grid gap-6` or `flex flex-col gap-6`

## 🧩 Example Component Classes

- **Card:**  
  `bg-card rounded-2xl shadow-sm p-6`

- **Button:**  
  `bg-primary text-primary-foreground rounded-lg px-4 py-2 font-semibold`

- **Input:**  
  `bg-input border border-border text-foreground rounded-lg shadow-sm p-3`

- **Section:**  
  `p-6` (for main content area or modals)

- **Form Progress Step:**  
  `text-sm text-muted-foreground font-medium`

## 🌒 Dark Mode

- All color utilities automatically adapt via the `.dark` class, thanks to CSS variables.

---

## ✅ **Usage Instructions**

- Only use variable-based utility classes for all color, background, and border styling.
- Never use hardcoded palette classes (`bg-white`, `text-slate-900`, etc).
- Maintain consistent border radii and spacing as specified above.

---

**This guide ensures a unified, scalable, and easily themeable UI across your entire project. Paste this at the top of every Codex or codegen task!**
