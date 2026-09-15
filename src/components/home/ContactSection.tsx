export default function ContactSection() {
  return (
    <section id="contact" className="border-b border-border bg-surface py-20">
      <div className="container-page grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div>
          <h2 className="text-3xl font-semibold">Contact the CareConnect team</h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
            Questions about using the directory, listing a clinic or accessing your account?
            Send us a message and we will reply within two working days.
          </p>

          <dl className="mt-8 space-y-5 text-sm">
            <div>
              <dt className="font-semibold">Email</dt>
              <dd className="text-muted-foreground">support@careconnect.health</dd>
            </div>
            <div>
              <dt className="font-semibold">Telephone</dt>
              <dd className="text-muted-foreground">
                0161 496 0188, Monday to Friday, 09:00 – 17:00
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Office</dt>
              <dd className="text-muted-foreground">
                2nd Floor, Kingsway House, 41 Peter Street, Manchester M2 5GB
              </dd>
            </div>
          </dl>

          <p className="mt-8 border-l-2 border-primary/60 pl-4 text-sm text-muted-foreground">
            CareConnect is not an emergency service. Contact your local emergency service if
            immediate help is required.
          </p>
        </div>
      </div>
    </section>
  );
}
