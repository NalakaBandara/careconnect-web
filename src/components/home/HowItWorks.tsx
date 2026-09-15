const steps = [
  {
    title: "Search for a professional",
    body: "Look up a name, speciality or service and narrow results by location.",
  },
  {
    title: "Review services and availability",
    body: "Open a public profile to read qualifications, services offered and general availability.",
  },
  {
    title: "Log in or register to book",
    body: "Create an account to request an appointment and keep your details private.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-b border-border bg-surface py-20">
      <div className="container-page">
        <h2 className="text-3xl font-semibold">How CareConnect works</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-12">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t-2 border-primary/70 pt-5">
              <span className="text-sm font-semibold text-primary">
                Step {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
