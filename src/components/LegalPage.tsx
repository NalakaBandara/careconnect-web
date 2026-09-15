import PageHero from "@/components/PageHero";
import type { LegalBlock } from "@/data/legal";

// Privacy and Terms are the same page with different words, so they share one
// component rather than two near-identical files.
export default function LegalPage({
  title,
  intro,
  blocks,
  updated,
}: {
  title: string;
  intro?: string;
  blocks: LegalBlock[];
  updated: string;
}) {
  return (
    <main>
      <PageHero title={title} intro={intro} />

      <section className="py-14">
        <div className="container-page max-w-2xl">
          <p className="text-sm text-muted-foreground">Last updated {updated}</p>

          <div className="mt-8 space-y-8">
            {blocks.map((block) => (
              <div key={block.heading ?? block.body.slice(0, 32)}>
                {block.heading && (
                  <h2 className="font-serif text-xl font-semibold">{block.heading}</h2>
                )}
                <p className={(block.heading ? "mt-3 " : "") + "leading-relaxed text-muted-foreground"}>
                  {block.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
