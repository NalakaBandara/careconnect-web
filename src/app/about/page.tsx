import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About",
    description: "About CareConnect"

}

export default function About() {
    return (
      <main>
        <h1>About CareConnect</h1>
        <p>CareConnect platform lets patients to connect with 100 of medical specialists within a tip of their hand.</p>
      </main>
    )
}