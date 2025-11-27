import Snapshot from "../../components/dashboard/Snapshot";
import Watchlist from "../../components/dashboard/Watchlist";
import ChartPlaceholder from "../../components/ui/ChartPlaceholder";

export default function DashboardPage() {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="flex flex-col gap-8 md:col-span-2">
        <Snapshot />
        <ChartPlaceholder height={320} />
      </div>
      <div className="flex flex-col gap-8">
        <Watchlist />
      </div>
    </div>
  );
}
