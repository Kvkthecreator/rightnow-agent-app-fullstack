"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import BasketCard from "@/components/BasketCard";
import { getAllBaskets, BasketOverview } from "@/lib/baskets/getAllBaskets";

export default function BasketsPage() {
  const [baskets, setBaskets] = useState<BasketOverview[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("updated");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    getAllBaskets().then(setBaskets).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    let arr = baskets.filter(
      (b) =>
        b.intent_summary?.toLowerCase().includes(term) ||
        b.raw_dump?.toLowerCase().includes(term)
    );
    if (sort === "alpha") {
      arr = [...arr].sort((a, b) =>
        (a.intent_summary || "").localeCompare(b.intent_summary || "")
      );
    } else if (sort === "created") {
      arr = [...arr].sort(
        (a, b) =>
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime()
      );
    } else {
      arr = [...arr].sort(
        (a, b) =>
          new Date(b.updated_at || "").getTime() -
          new Date(a.updated_at || "").getTime()
      );
    }
    return arr;
  }, [baskets, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">🧺 My Baskets</h1>
          <p className="text-sm text-muted-foreground">
            Lightweight containers for your tasks, context, and thoughts
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button asChild>
            <Link href="/baskets/create">+ Create Basket</Link>
          </Button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="updated">Last updated</option>
            <option value="created">Created</option>
            <option value="alpha">A–Z</option>
          </select>
          <Input
            className="h-9 text-sm"
            placeholder="Search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {pageData.length === 0 ? (
        <EmptyState
          title="No baskets found"
          action={
            <Button asChild>
              <Link href="/baskets/create">Create Basket</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pageData.map((b) => (
            <BasketCard key={b.id} basket={b} />
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ◀
          </Button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`px-2 text-sm rounded ${n === page ? "font-semibold" : "text-muted-foreground"}`}
            >
              {n}
            </button>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={page === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            ▶
          </Button>
        </div>
      )}
    </div>
  );
}
