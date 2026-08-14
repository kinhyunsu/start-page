import AuthButton from "@/components/AuthButton";
import DashboardGrid from "@/components/layout/DashboardGrid";
import ClockWeatherWidget from "@/components/widgets/ClockWeatherWidget";
import NaverSearchWidget from "@/components/widgets/NaverSearchWidget";
import PhotoWidget from "@/components/widgets/PhotoWidget";
import CalendarWidget from "@/components/widgets/CalendarWidget";
import PortfolioWidget from "@/components/widgets/PortfolioWidget";
import NewsWidget from "@/components/widgets/NewsWidget";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
            <span className="h-2 w-2 rounded-full bg-accent" />
            시작페이지
          </span>
          <AuthButton />
        </div>
      </header>
      <DashboardGrid>
        <NaverSearchWidget />
        <ClockWeatherWidget />
        <PhotoWidget />
        <CalendarWidget />
        <PortfolioWidget />
        <NewsWidget />
      </DashboardGrid>
    </main>
  );
}
