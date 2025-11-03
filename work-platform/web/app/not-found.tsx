import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-8 text-center space-y-4">
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      <p className="text-muted-foreground">Sorry, we couldn\'t find that.</p>
      <Link href="/baskets" className="text-blue-600 hover:underline">
        Go back to Baskets
      </Link>
    </div>
  );
}
