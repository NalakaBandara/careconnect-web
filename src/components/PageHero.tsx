// The banner every public page opens with. One component so the spacing and
// type sizes cannot drift between pages.
export default function PageHero({
  title,
  intro,
  plain = false,
}: {
  title: string;
  intro?: string;
  plain?: boolean;
}) {
  return (
    <section
      className={
        "border-b border-border py-14 " + (plain ? "bg-background" : "bg-surface")
      }
    >
      <div className="container-page">
        <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight">{title}</h1>
        {intro && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {intro}
          </p>
        )}
      </div>
    </section>
  );
}
