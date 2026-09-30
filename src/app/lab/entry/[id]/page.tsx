import type { Metadata } from "next";
import { LabEntryView } from "@/components/lab/lab-entry-view";

export const metadata: Metadata = {
  title: "Saved analysis",
  description: "A saved Story Lab analysis from your logbook.",
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function LabEntryPage({ params }: PageProps<"/lab/entry/[id]">) {
  const { id } = await params;
  return <LabEntryView id={safeDecode(id)} />;
}
