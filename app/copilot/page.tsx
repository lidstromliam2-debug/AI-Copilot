// app/copilot/page.tsx
"use client";

import Navbar from "../../components/ui/Navbar";
import Sidebar from "../../components/Sidebar";
import CopilotChat from "../../components/CopilotChat";
import UploadAnalyze, { ChartImage } from "../../components/UploadAnalyze";
import QuickActions from "../../components/QuickActions";
import JournalSave from "../../components/JournalSave";
import RiskCalculator from "../../components/RiskCalculator";

import { useState } from "react";

export default function CopilotPage() {
	const [chartImages, setChartImages] = useState<ChartImage[]>([]);
	return (
		<div className="min-h-screen bg-gray-50 font-sans flex flex-col">
			<Navbar />
			<div className="flex flex-1">
				{/* Sidebar (egen kolumn, sticky) */}
				<div className="flex-shrink-0"><Sidebar /></div>
				{/* 3-kolumns grid: Main Content & Right Panel */}
				<div className="flex-1">
					<div className="grid grid-cols-12 gap-8 h-full px-8 py-10">
						{/* Main Content (center, 7 kolumner) */}
						<section className="col-span-7 flex flex-col items-center justify-start">
							{/* Header box */}
							<div className="w-full max-w-2xl bg-white rounded-lg shadow border p-6 mb-6">
								<div className="text-xs text-gray-400 font-semibold tracking-widest mb-2">AI COPILOT</div>
								<div className="text-2xl font-bold">Ask the AI, get actionable trade ideas</div>
							</div>
							{/* Copilot Chat */}
							<div className="w-full max-w-2xl mb-6">
								<CopilotChat chartImages={chartImages} onClearImages={() => setChartImages([])} />
							</div>
							{/* Upload & Analyze */}
							<div className="w-full max-w-2xl">
								<UploadAnalyze onImagesChange={setChartImages} />
							</div>
						</section>
						{/* Right Panel (4 kolumner) */}
						<aside className="col-span-5 flex flex-col gap-6 justify-start">
							<QuickActions />
							<JournalSave />
							<RiskCalculator />
						</aside>
					</div>
				</div>
			</div>
		</div>
	);
}

