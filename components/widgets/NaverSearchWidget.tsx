import WidgetCard from "./WidgetCard";

export default function NaverSearchWidget() {
  return (
    <WidgetCard title="검색" className="sm:col-span-2 lg:col-span-3">
      <form
        method="GET"
        action="https://search.naver.com/search.naver"
        target="_blank"
        className="flex gap-2"
      >
        <input
          type="text"
          name="query"
          placeholder="네이버에서 검색"
          autoComplete="off"
          className="flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-base text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-ink"
        >
          검색
        </button>
      </form>
    </WidgetCard>
  );
}
