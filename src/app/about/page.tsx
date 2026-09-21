import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { buttonClasses } from "@/components/Button";
import { aboutParagraphs } from "@/data/legal";

export const metadata: Metadata = {
  title: "About",
  description:
    "CareConnect helps people find suitable healthcare professionals and services in one place. How the directory works, and what we deliberately do not do.",
};

export default function AboutPage() {
  return (
    <main id="main">
      <PageHero
        title="About CareConnect"
        intro="CareConnect helps people discover suitable healthcare professionals and services in one place, without calling several practices to find out who offers what."
      />

      {/* A div, not a section: the About body: the page heading lives in PageHero above,
          and a section with no heading of its own is one an assistive
          technology cannot announce. */}
      <div className="py-14">
        <div className="container-page grid gap-12 lg:grid-cols-[1.4fr_0.6fr] lg:gap-20">
          <div className="max-w-2xl space-y-6">
            {aboutParagraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>

          <aside className="h-fit rounded-lg border border-border bg-background p-6 shadow-soft">
            <h2 className="font-serif text-lg font-semibold">Ready to look around?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Start with the directory, or explore services by category.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Link href="/professionals" className={buttonClasses("primary", "md")}>
                Find a Professional
              </Link>
              <Link href="/services" className={buttonClasses("outline", "md")}>
                Explore Services
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
