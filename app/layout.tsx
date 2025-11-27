import "../styles/globals.css";
import TickerMarquee from "@/components/ui/TickerMarquee";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bloomberg-bg text-bloomberg-black font-inter">
        {/* NAVIGATION - Bloomberg-style navbar */}
        <nav className="border-b border-bloomberg-border bg-white sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
            {/* LOGO */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-bloomberg-black flex items-center justify-center">
                <span className="text-white font-bold text-xs">Q</span>
              </div>
              <span className="font-semibold text-bloomberg-headline text-base tracking-tight">Quantpilot</span>
            </div>

            {/* NAV LINKS */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <a href="/" className="text-bloomberg-text hover:text-bloomberg-blue transition">Home</a>
              <a href="/dashboard" className="text-bloomberg-text hover:text-bloomberg-blue transition">Dashboard</a>
              <a href="/copilot" className="text-bloomberg-text hover:text-bloomberg-blue transition">AI Copilot</a>
              <a href="/market" className="text-bloomberg-text hover:text-bloomberg-blue transition">Market</a>
              <a href="/journal" className="text-bloomberg-text hover:text-bloomberg-blue transition">Journal</a>
              <a href="/backtest" className="text-bloomberg-text hover:text-bloomberg-blue transition">Backtest</a>
              <a href="/analytics" className="text-bloomberg-text hover:text-bloomberg-blue transition">Analytics</a>
              <a href="/alerts" className="text-bloomberg-text hover:text-bloomberg-blue transition">Alerts</a>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <a href="/auth/login" className="text-bloomberg-black text-sm font-medium hover:text-bloomberg-blue transition">Sign in</a>
              <a
                href="/auth/signup"
                className="px-4 py-2 bg-bloomberg-black text-white text-sm font-medium hover:bg-bloomberg-btn-hover transition"
              >
                Sign up
              </a>
            </div>
          </div>
        </nav>

        {/* Global ticker */}
        <TickerMarquee />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
