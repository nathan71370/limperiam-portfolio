import { Sidebar } from "@/components/admin/sidebar";

export const metadata = {
  title: "Admin — limperiam",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
