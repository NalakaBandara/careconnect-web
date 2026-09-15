import Link from "next/link";

export default function AboutSection() {
  return (
    <section className="border-b border-border bg-surface py-20">
      <div className="container-page max-w-3xl">
        <h2 className="text-3xl font-semibold">About CareConnect</h2>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          CareConnect brings healthcare professionals and the services they provide into one
          directory, so people can compare specialities, clinics and appointment options without
          calling several practices. Clinics keep their own listings up to date, and patients
          manage their appointments from a single account.
        </p>
        <Link
          href="/about"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          Read more about CareConnect
        </Link>
      </div>
    </section>
  );
}
