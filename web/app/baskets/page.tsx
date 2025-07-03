"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import BasketCard from "@/components/BasketCard";
import { getAllBaskets, BasketOverview } from "@/lib/baskets/getAllBaskets";
import PageHeader from "@/components/page/PageHeader";
import CreateBasketDialog from "@/components/CreateBasketDialog";

export default function BasketsPage() {
  const { session, isLoading } = useSessionContext();
  const router = useRouter();
  const [baskets, setBaskets] = useState<BasketOverview[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace("/about");
      return;
    }
    getAllBaskets().then(setBaskets).catch(console.error);
  }, [session, isLoading, router]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    let arr = baskets.filter(
      (b) =>
        b.name?.toLowerCase().includes(term) ||
        b.raw_dump_body?.toLowerCase().includes(term)
    );
    if (sort === "alpha") {
      arr = [...arr].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    } else if (sort === "created") {
      arr = [...arr].sort(
        (a, b) =>
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime()
      );
    }
    return arr;
  }, [baskets, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (isLoading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        emoji="🧺"
        title="My Baskets"
        description="Lightweight containers for your tasks, context, and thoughts"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setOpen(true)}>+ New Basket</Button>
            <CreateBasketDialog open={open} onOpenChange={setOpen} />
            <Select value={sort} onValueChange={(v) => setSort(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Date created</SelectItem>
                <SelectItem value="alpha">A–Z</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="Search"
              className="w-[150px]"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        }
      />

      <Card>
        <p className="text-sm text-muted-foreground">
          Organize your work into modular containers for easy management.
        </p>
      </Card>

      {pageData.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No baskets found. You can create a new one to get started.
        </div>
      ) : (
        <div className="space-y-4">
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
              className={`px-2 text-sm rounded ${
                n === page ? "font-semibold" : "text-muted-foreground"
              }`}
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
