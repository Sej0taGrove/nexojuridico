export default function AbogadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <aside className="w-[260px] border-r border-gray-200 bg-gray-50 p-6">
        <p className="text-sm font-medium text-gray-500">
          Sidebar abogado — pendiente
        </p>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
