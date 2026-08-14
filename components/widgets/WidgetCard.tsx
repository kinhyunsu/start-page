type WidgetCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  hideTitle?: boolean;
};

export default function WidgetCard({ title, children, className = "", hideTitle = false }: WidgetCardProps) {
  return (
    <section
      className={`relative rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(20,15,40,0.04),0_8px_20px_-14px_rgba(109,94,240,0.35)] transition-shadow hover:shadow-[0_1px_2px_rgba(20,15,40,0.04),0_12px_28px_-14px_rgba(109,94,240,0.45)] ${className}`}
    >
      {!hideTitle && (
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-ink-faint uppercase">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
