export default function DashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid w-full min-w-0 flex-1 grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {children}
    </div>
  );
}
