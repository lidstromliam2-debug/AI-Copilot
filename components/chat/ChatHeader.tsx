import DailyPlan from "../daily/DailyPlan";

export default function ChatHeader(){
  return (
    <div className="flex items-center gap-3 p-4 border-b justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">AI</div>
        <div>
          <div className="font-semibold">Trading Copilot</div>
          <div className="text-sm text-muted-foreground">Assistant 02 Real-time market insights</div>
        </div>
      </div>
      <DailyPlan />
    </div>
  );
}
