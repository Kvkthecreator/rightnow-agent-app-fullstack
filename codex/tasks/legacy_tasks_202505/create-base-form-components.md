## 📄 Task Title
Create Base Reusable Form Components (Input, Textarea, Select)

## 🎯 Goal
Create a reusable set of form components compatible with `react-hook-form`, styled with shadcn/ui, and aligned with our theme tokens in `/styles/theme-guide.md`.

These should be used across profile setup, task creation, and other flows.

## 🧠 Prompt to Codex

Create the following components in `components/ui/`:

---

### 1. `TextInputField.tsx`

Props:
- `control`: from `useForm`
- `name`: string
- `label`: string
- `placeholder`?: string
- `disabled`?: boolean

Use:
- shadcn/ui: `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- input: `Input` from `@/components/ui/input`
- spacing: `space-y-2`, rounded-lg

---

### 2. `TextareaField.tsx`

Same as `TextInputField`, but uses `Textarea` component from `shadcn/ui`.

---

### 3. `SelectField.tsx`

Props:
- `control`: from `useForm`
- `name`: string
- `label`: string
- `options`: array of `{ label: string, value: string }`

Use:
- shadcn/ui: `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- Show selected label inside the `Trigger`
- Wrap in `FormField` context

---

### Styling

- Use spacing/typography from `/styles/theme-guide.md`
- All fields must show validation errors via `FormMessage`
- Apply `text-sm font-medium` for labels

---

## ✅ Success Criteria

- Components are available at `components/ui/*.tsx`
- Fully typed with TS + react-hook-form-compatible
- Uses consistent shadcn/ui styling
- Committed and tested with dummy form (e.g. `/demo`)
