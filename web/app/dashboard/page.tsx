"use client";

import { useForm } from "react-hook-form";
import { TextInputField } from "@/components/ui/TextInputField";
import { TextareaField } from "@/components/ui/TextareaField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSessionContext } from "@supabase/auth-helpers-react";

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading } = useSessionContext();
  const { control, handleSubmit } = useForm({ defaultValues: { firstName: "", bio: "", role: "" } });

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      localStorage.setItem("postLoginRedirect", window.location.pathname);
      router.replace("/login");
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return null;
  }
  const onSubmit = (data: any) => console.log(data);
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        🌈 Design System Preview
      </h1>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Card Component</h2>
        <p className="text-sm text-muted-foreground">
          This is a simple card showing off border radius, padding, and text styles.
        </p>
      </Card>

      <div className="space-x-4">
        <Button>Primary Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="ghost">Ghost Button</Button>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          📋 Form Demo
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 max-w-md">
          <TextInputField
            control={control}
            name="firstName"
            label="First Name"
            placeholder="Enter your first name"
          />
          <TextareaField
            control={control}
            name="bio"
            label="Bio"
            placeholder="Tell us about yourself"
          />
          <SelectField
            control={control}
            name="role"
            label="Role"
            options={[
              { value: "", label: "Select a role" },
              { value: "admin", label: "Admin" },
              { value: "user", label: "User" },
            ]}
          />
          <Button type="submit">Submit</Button>
        </form>
      </section>
    </div>
  );
}
