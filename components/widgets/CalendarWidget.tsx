import WidgetCard from "./WidgetCard";

export default function CalendarWidget() {
  return (
    <WidgetCard title="캘린더">
      <div className="flex h-full min-h-[88px] items-center justify-center">
        <p className="text-sm text-ink-faint">준비 중이에요</p>
      </div>
    </WidgetCard>
  );
}
