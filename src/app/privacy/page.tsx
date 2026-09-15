import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { privacyBlocks } from "@/data/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What information CareConnect collects, what is public, what is shared with clinics, and how to request a copy or deletion of your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="What we collect, what is public, and what happens to your details when you request an appointment."
      blocks={privacyBlocks}
      updated="1 September 2026"
    />
  );
}
