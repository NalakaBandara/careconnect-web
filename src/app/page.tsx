import Hero from "@/components/home/Hero";
import FeaturedProfessionals from "@/components/home/FeaturedProfessionals";
import ServicesSection from "@/components/home/ServicesSection";
import HowItWorks from "@/components/home/HowItWorks";
import TrustSection from "@/components/home/TrustSection";
import AboutSection from "@/components/home/AboutSection";
import FaqSection from "@/components/home/FaqSection";
import ContactSection from "@/components/home/ContactSection";
import Reveal from "@/components/Reveal";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { closed } = await searchParams;

  return (
    <main id="main">
      {closed === "1" && (
        // role="status" so a screen reader announces it on arrival.
        <p
          role="status"
          className="container-page mt-6 rounded-md border border-primary/30 bg-primary-soft px-4 py-3 text-sm"
        >
          Your account has been closed and your personal details removed.
        </p>
      )}

      {/* The hero is above the fold, so it is not wrapped - animating what is
          already on screen when the page loads just delays it. */}
      <Hero />

      {/* Each section below is a Server Component passed as children into a
          Client Component. Only Reveal's own code reaches the browser; the
          sections themselves still ship no JavaScript. */}
      <Reveal>
        <FeaturedProfessionals />
      </Reveal>
      <Reveal>
        <ServicesSection />
      </Reveal>
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <TrustSection />
      </Reveal>
      <Reveal>
        <AboutSection />
      </Reveal>
      <Reveal>
        <FaqSection />
      </Reveal>
      <Reveal>
        <ContactSection />
      </Reveal>
    </main>
  );
}
