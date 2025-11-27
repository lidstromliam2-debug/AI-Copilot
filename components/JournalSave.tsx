import React from "react";
import { Button } from "./ui/Button";

export default function JournalSave() {
  return (
    <div className="bg-white rounded-lg shadow border p-4 mb-4">
      <div className="font-semibold mb-2">Save to Journal</div>
      <textarea className="w-full border rounded p-2 text-sm mb-2" rows={3} placeholder="Add trade notes..."></textarea>
      <Button className="bg-black text-white w-full">Save to Journal</Button>
    </div>
  );
}
