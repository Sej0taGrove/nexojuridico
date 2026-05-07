import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicTopbar } from "@/components/layout/PublicTopbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicTopbar />
      <main className="flex flex-1 flex-col">{children}</main>
      <PublicFooter />
    </>
  );
}
