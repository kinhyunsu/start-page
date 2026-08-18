import AuthButton from "@/components/AuthButton";
import LoginBanner from "@/components/LoginBanner";
import DashboardGrid from "@/components/layout/DashboardGrid";
import ClockWeatherWidget from "@/components/widgets/ClockWeatherWidget";
import NaverSearchWidget from "@/components/widgets/NaverSearchWidget";
import PhotoWidget from "@/components/widgets/PhotoWidget";
import CalendarWidget from "@/components/widgets/CalendarWidget";
import RoutineWidget from "@/components/widgets/RoutineWidget";
import EisenhowerMatrixWidget from "@/components/widgets/EisenhowerMatrixWidget";
import SubscriptionWidget from "@/components/widgets/SubscriptionWidget";
import ExpenseWidget from "@/components/widgets/ExpenseWidget";
import JournalWidget from "@/components/widgets/JournalWidget";
import PortfolioWidget from "@/components/widgets/PortfolioWidget";
import NewsWidget from "@/components/widgets/NewsWidget";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
            <span className="h-2 w-2 rounded-full bg-accent" />
            시작페이지
          </span>
          <AuthButton />
        </div>
      </header>
      <LoginBanner />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6 sm:gap-6 sm:p-8 lg:flex-row lg:items-start">
        <aside className="lg:w-64 lg:shrink-0">
          <RoutineWidget />
        </aside>
        <DashboardGrid>
          <NaverSearchWidget />
          <ClockWeatherWidget />
          <PhotoWidget />
          <CalendarWidget />
          <EisenhowerMatrixWidget />
          <SubscriptionWidget />
          <ExpenseWidget />
          <JournalWidget />
          <PortfolioWidget />
          <NewsWidget />
        </DashboardGrid>
      </div>
      <footer className="mt-auto border-t border-border py-6 text-center text-xs text-ink-faint">
        <a
          href="https://github.com/kinhyunsu/start-page"
          target="_blank"
          rel="noreferrer"
          className="hover:text-ink-soft"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
