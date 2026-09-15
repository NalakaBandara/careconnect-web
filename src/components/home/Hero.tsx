import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/Button";
import Parallax from "@/components/Parallax";

export default function Hero() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Healthcare made easier
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] sm:text-5xl">
            Find the right healthcare professional with confidence
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Search practitioners by name, speciality or service, read what each clinic offers
            and see when appointments are generally available, before you create an account.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/professionals" className={buttonClasses("primary", "lg")}>
              Find a Professional
            </Link>
            <Link href="/services" className={buttonClasses("outline", "lg")}>
              Explore Services
            </Link>
          </div>
        </div>

        {/* Only the image drifts. Moving body text as you scroll makes it
            harder to read, which is the opposite of the point. */}
        <Parallax speed={28} className="relative">
          <Image
            src="/hero-consultation.jpg"
            alt="A doctor in teal scrubs listening to an older patient during a clinic consultation"
            width={1200}
            height={900}
            // The hero is the largest thing above the fold, so it loads first.
            priority
            className="aspect-4/3 w-full rounded-lg border border-border object-cover shadow-raised"
          />
          <div className="absolute -bottom-6 -left-6 hidden rounded-lg border border-border bg-background/95 p-4 shadow-raised backdrop-blur sm:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Registered practitioners
            </p>
            <p className="mt-1 font-serif text-2xl font-semibold text-primary">240+ clinics</p>
          </div>
        </Parallax>
      </div>
    </section>
  );
}
