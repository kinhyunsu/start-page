import AuthButton from "@/components/AuthButton";
import DashboardGrid from "@/components/layout/DashboardGrid";
import ClockWidget from "@/components/widgets/ClockWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import NaverSearchWidget from "@/components/widgets/NaverSearchWidget";
import PortfolioWidget from "@/components/widgets/PortfolioWidget";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl justify-end px-6 pt-4">
        <AuthButton />
      </div>
      <DashboardGrid>
        <NaverSearchWidget />
        <ClockWidget />
        <WeatherWidget />
        <PortfolioWidget />
      </DashboardGrid>
    </main>
  );
}
