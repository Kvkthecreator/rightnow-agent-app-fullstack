"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllBaskets, type BasketOverview } from "@/lib/baskets/getAllBaskets";
import { fetchWithToken } from "@/lib/fetchWithToken";
import AddMemoryComposer from "@/components/basket/AddMemoryComposer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function CreatePage() {
  const router = useRouter();
  const [baskets, setBaskets] = useState<BasketOverview[]>([]);
  const [selected, setSelected] = useState("");
  const [showSelector, setShowSelector] = useState(true);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const list = await getAllBaskets();
      setBaskets(list);
      if (list.length === 1) {
        setSelected(list[0].id);
        setShowSelector(false);
      }
      if (list.length === 0 && process.env.NEXT_PUBLIC_AUTO_PERSONAL_BASKET === "1") {
        const res = await fetchWithToken("/api/baskets/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Personal Memory" }),
        });
        if (res.ok) {
          const data = await res.json();
          const id = data.id || data.basket_id;
          const basket = { id, name: data.name || "Personal Memory", created_at: data.created_at };
          setBaskets([basket]);
          setSelected(id);
          setShowSelector(false);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  async function handleCreateBasket() {
    const name = newName.trim();
    if (!name) return;
    const res = await fetchWithToken("/api/baskets/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      const id = data.id || data.basket_id;
      const basket = { id, name: data.name || name, created_at: data.created_at };
      setBaskets((prev) => [...prev, basket]);
      setSelected(id);
      setCreatingNew(false);
      setNewName("");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {!loading && (
        <div className="space-y-2">
          {baskets.length === 1 && !showSelector ? (
            <div className="text-sm">
              Saving to <strong>{baskets[0].name || "Untitled"}</strong>{" "}
              <button className="underline" onClick={() => setShowSelector(true)}>
                Change…
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Choose a basket</label>
              <select
                className="border rounded p-2 w-full"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Select a basket</option>
                {baskets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name || "Untitled"}
                  </option>
                ))}
              </select>
            </div>
          )}
          {creatingNew ? (
            <div className="flex gap-2 mt-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Basket name"
              />
              <Button onClick={handleCreateBasket} disabled={!newName.trim()}>
                Create
              </Button>
            </div>
          ) : (
            <button className="text-sm underline" onClick={() => setCreatingNew(true)}>
              New basket (advanced)
            </button>
          )}
        </div>
      )}

      <AddMemoryComposer
        basketId={selected}
        disabled={!selected}
        onSuccess={(dump) => router.push(`/baskets/${dump.basket_id}/dashboard`)}
      />
    </div>
  );
}

