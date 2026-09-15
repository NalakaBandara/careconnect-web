import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { termsBlocks } from "@/data/legal";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "The terms for using the CareConnect directory and requesting appointments, including who provides clinical care and your account responsibilities.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      intro="The rules for using the directory and requesting appointments through CareConnect."
      blocks={termsBlocks}
      updated="1 September 2026"
    />
  );
}
