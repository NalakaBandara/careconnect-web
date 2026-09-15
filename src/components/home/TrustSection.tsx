const points = [
  {
    title: "Verified professional information",
    body: "Profile details, qualifications and services are supplied and confirmed by the clinic before publication.",
  },
  {
    title: "Secure account access",
    body: "Accounts are protected with individual logins, and personal details are never shown on public profiles.",
  },
  {
    title: "Clear appointment information",
    body: "Each profile explains which services are offered and when appointments are generally available.",
  },
  {
    title: "Easy access on web and mobile",
    body: "The same search, filtering and booking experience works on phones, tablets and desktop browsers.",
  },
];

export default function TrustSection() {
  return (
    <section className="border-b border-border py-20">
      <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <h2 className="text-3xl font-semibold">Built around careful, everyday healthcare</h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            CareConnect keeps the information you need visible and the information that should
            stay private protected. No ratings, no rankings, just accurate practice details.
          </p>
        </div>
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {points.map((point) => (
            <li key={point.title}>
              <h3 className="text-base font-semibold">{point.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
