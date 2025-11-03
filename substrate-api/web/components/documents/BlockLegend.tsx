export default function BlockLegend() {
  const items = [
    { label: "Proposed", className: "border border-border text-muted-foreground" },
    { label: "Accepted", className: "bg-primary text-primary-foreground" },
    { label: "Locked", className: "border border-border text-muted-foreground" },
    { label: "Constant", className: "bg-yellow-200 text-yellow-900" },
  ];
  return (
    <div className="p-4 space-y-1 text-xs">
      <h3 className="font-semibold mb-2">Legend</h3>
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <span className={`px-1 py-0.5 rounded ${it.className}`}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
