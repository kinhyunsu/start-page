import AuthButton from "@/components/AuthButton";
import DashboardGrid from "@/components/layout/DashboardGrid";
import ClockWidget from "@/components/widgets/ClockWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import NaverSearchWidget from "@/components/widgets/NaverSearchWidget";
import PhotoWidget from "@/components/widgets/PhotoWidget";
import PortfolioWidget from "@/components/widgets/PortfolioWidget";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold tracking-tight text-ink">🏠 시작페이지</span>
          <AuthButton />
        </div>
      </header>
      <DashboardGrid>
        <NaverSearchWidget />
        <ClockWidget />
        <WeatherWidget />
        <PhotoWidget />
        <PortfolioWidget />
      </DashboardGrid>
    </main>
  );
}
