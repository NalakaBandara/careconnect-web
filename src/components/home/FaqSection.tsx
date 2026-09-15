import { faqs } from "@/data/faqs";

// Uses native <details>/<summary>, so the accordion works with zero JavaScript
// and stays a Server Component.
export default function FaqSection({ heading = "Questions guests ask most" }: { heading?: string }) {
  return (
    <section id="faqs" className="border-b border-border py-20">
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <h2 className="text-3xl font-semibold">{heading}</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Everything about browsing, accounts and privacy before you decide to register.
          </p>
        </div>
        <div className="w-full">
          {faqs.map((faq) => (
            <details key={faq.question} className="border-b border-border py-4">
              <summary className="cursor-pointer text-base font-medium">{faq.question}</summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
