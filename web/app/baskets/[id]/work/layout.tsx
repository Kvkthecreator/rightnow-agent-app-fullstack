import Shell from "@/components/layouts/Shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Shell collapseSidebar>{children}</Shell>;
}
