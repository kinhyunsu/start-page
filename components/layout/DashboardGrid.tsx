export default function DashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}
