"use client";
import BasketCreateForm from "@/components/baskets/BasketCreateForm";

export default function BasketNewPage() {
  return (
    <div className="px-6 py-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">What are we working on?</h1>
      <BasketCreateForm />
    </div>
  );
}
