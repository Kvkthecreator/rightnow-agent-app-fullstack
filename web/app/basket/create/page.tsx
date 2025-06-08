"use client";
import BasketCreateForm from "@/components/baskets/BasketCreateForm";

export default function BasketNewPage() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <BasketCreateForm onSubmit={(blocks) => console.log(blocks)} />
    </div>
  );
}
