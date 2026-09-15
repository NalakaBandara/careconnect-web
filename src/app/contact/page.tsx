import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { contactDetails } from "@/data/legal";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Contact the CareConnect team about using the directory, listing a clinic or accessing your account. We reply within two working days.",
};

export default function ContactPage() {
  return (
    <main>
      <PageHero
        title="Contact us"
        intro="Send the team a message and we will reply within two working days."
        plain
      />

      <section className="bg-surface py-14">
        <div className="container-page grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <h2 className="font-serif text-2xl font-semibold sm:text-3xl">
              Contact the CareConnect team
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
              Questions about using the directory, listing a clinic or accessing your account?
              Send us a message and we will reply within two working days.
            </p>

            <dl className="mt-8 space-y-5 text-sm">
              <div>
                <dt className="font-semibold">Email</dt>
                <dd className="text-muted-foreground">
                  <a href={`mailto:${contactDetails.email}`} className="hover:text-primary hover:underline">
                    {contactDetails.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Telephone</dt>
                <dd className="text-muted-foreground">{contactDetails.telephone}</dd>
              </div>
              <div>
                <dt className="font-semibold">Office</dt>
                <dd className="text-muted-foreground">{contactDetails.office}</dd>
              </div>
            </dl>

            <p className="mt-8 border-l-2 border-primary/60 pl-4 text-sm leading-relaxed text-muted-foreground">
              CareConnect is not an emergency service. Contact your local emergency service if
              immediate help is required.
            </p>
          </div>

          <ContactForm />
        </div>
      </section>
    </main>
  );
}
