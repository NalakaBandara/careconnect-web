import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { faqs } from "@/data/faqs";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Practical answers about browsing the CareConnect directory, creating an account and how your information is used.",
};

export default function FaqsPage() {
  return (
    <main id="main">
      <PageHero
        title="Frequently asked questions"
        intro="Practical answers about browsing, accounts and privacy on CareConnect."
      />

      {/* A div, not a section: the FAQ list: the page heading lives in PageHero above,
          and a section with no heading of its own is one an assistive
          technology cannot announce. */}
      <div className="py-14">
        <div className="container-page max-w-3xl">
          {/* Native <details>/<summary>: the browser handles open and closed,
              keyboard access and screen-reader announcement. No JavaScript. */}
          {faqs.map((faq) => (
            <details key={faq.question} className="border-b border-border py-5">
              <summary className="cursor-pointer text-base font-medium">{faq.question}</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
            </details>
          ))}

          <p className="mt-10 text-sm text-muted-foreground">
            Still stuck?{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              Contact the team
            </Link>{" "}
            and we will reply within two working days.
          </p>
        </div>
      </div>
    </main>
  );
}
