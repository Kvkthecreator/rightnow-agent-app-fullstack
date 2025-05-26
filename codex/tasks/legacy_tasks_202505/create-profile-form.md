## 📄 Task Title

Create `ProfileForm` Using Base Form Components

## 🎯 Goal

Build a reusable form for creating/editing a user profile using `react-hook-form`, `zod`, and our base components:

* `TextInputField`
* `TextareaField`
* `SelectField`

## 🧠 Prompt to Codex

Create `ProfileForm.tsx` inside `web/components/forms/`.

Use the following fields:

* `name`: required text input
* `bio`: optional textarea (160 character max)
* `goal`: select input (options: "Audience Growth", "Monetization", "Personal Branding")

Form behavior:

* Uses `useForm` + `zodResolver` with validation schema
* Accepts `onSubmit: (data: ProfileFormData) => void` as prop
* Uses our base components from `/components/ui/`
* Labels and error messages follow the theme guide (text-sm, font-medium, FormMessage)

## 📊 Example Interface

```ts
interface ProfileFormData {
  name: string
  bio?: string
  goal: string
}
```

## 🎨 Styling

* Use vertical spacing: `space-y-6`
* Container: `div` with `max-w-xl mx-auto p-6`
* Aligns visually with `/demo/form-preview`

## ✅ Success Criteria

* `ProfileForm.tsx` is reusable and modular
* Validated using zod + `react-hook-form`
* Uses only our `ui/` components
* Prepped for future use in profile creation or onboarding flows
