import Hero from "@/components/home/Hero";
import FeaturedProfessionals from "@/components/home/FeaturedProfessionals";
import ServicesSection from "@/components/home/ServicesSection";
import HowItWorks from "@/components/home/HowItWorks";
import TrustSection from "@/components/home/TrustSection";
import AboutSection from "@/components/home/AboutSection";
import FaqSection from "@/components/home/FaqSection";
import ContactSection from "@/components/home/ContactSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturedProfessionals />
      <ServicesSection />
      <HowItWorks />
      <TrustSection />
      <AboutSection />
      <FaqSection />
      <ContactSection />
    </main>
  );
}
