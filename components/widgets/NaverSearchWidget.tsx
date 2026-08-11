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
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          검색
        </button>
      </form>
    </WidgetCard>
  );
}
