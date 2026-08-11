type WidgetCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export default function WidgetCard({ title, children, className = "" }: WidgetCardProps) {
  return (
    <section
      className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      <h2 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {children}
    </section>
  );
}
