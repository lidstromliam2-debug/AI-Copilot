import React from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export default function JournalForm() {
  return (
    <form className="card flex flex-col gap-4 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-2">Lägg till trade</h3>
      <Input placeholder="Asset (ex: BTCUSD)" />
      <Input placeholder="Entry" type="number" />
      <Input placeholder="Stop" type="number" />
      <Input placeholder="Take Profit" type="number" />
      <Input placeholder="PnL" type="number" />
      <Input placeholder="Taggar (kommaseparerat)" />
      <Input placeholder="Ladda upp screenshot (UI)" type="file" />
      <Button type="submit">Spara trade</Button>
    </form>
  );
}
