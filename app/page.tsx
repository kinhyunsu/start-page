import AuthButton from "@/components/AuthButton";
import DashboardGrid from "@/components/layout/DashboardGrid";
import ClockWeatherWidget from "@/components/widgets/ClockWeatherWidget";
import NaverSearchWidget from "@/components/widgets/NaverSearchWidget";
import PhotoWidget from "@/components/widgets/PhotoWidget";
import CalendarWidget from "@/components/widgets/CalendarWidget";
import RoutineWidget from "@/components/widgets/RoutineWidget";
import SubscriptionWidget from "@/components/widgets/SubscriptionWidget";
import ExpenseWidget from "@/components/widgets/ExpenseWidget";
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6 sm:gap-6 sm:p-8 lg:flex-row lg:items-start">
        <aside className="lg:w-64 lg:shrink-0">
          <RoutineWidget />
        </aside>
        <DashboardGrid>
          <NaverSearchWidget />
          <ClockWeatherWidget />
          <PhotoWidget />
          <CalendarWidget />
          <SubscriptionWidget />
          <ExpenseWidget />
          <PortfolioWidget />
          <NewsWidget />
        </DashboardGrid>
      </div>
    </main>
  );
}
