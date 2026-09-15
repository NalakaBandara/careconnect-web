import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CareConnect - Find healthcare professionals",
    template: "%s | CareConnect",
  },
  description: "CareConnect is a platform to connect patients with doctors.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${sourceSerif4.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Runs before the rest of the body is painted, so the scroll-reveal
            CSS can hide things without ever flashing. It is also the switch
            that keeps the page visible when JavaScript never arrives: with no
            data-js attribute, nothing is hidden at all. */}
        <script
          dangerouslySetInnerHTML={{ __html: `document.documentElement.dataset.js="on"` }}
        />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
