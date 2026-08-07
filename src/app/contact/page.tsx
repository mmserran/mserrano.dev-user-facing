import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";
import EndcapShell from "@/components/illustration/EndcapShell";
import PageTitle from "@/components/typography/PageTitle";
import { getContactEmail } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact | Mark Serrano",
  description: "Get in touch with Mark Serrano.",
  alternates: {
    canonical: "/contact/",
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] text-white">
      <PageTitle>Contact</PageTitle>

      <section
        aria-labelledby="contact-form-title"
        className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8"
      >
        <div className="rounded-sm bg-white px-6 py-10 text-black shadow-2xl sm:px-10 sm:py-12">
          <h2 id="contact-form-title" className="text-3xl font-normal sm:text-4xl">
            Let&apos;s Talk
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Fields marked with an asterisk are required.
          </p>
          <div className="mt-5">
            <ContactForm contactEmail={getContactEmail()} />
          </div>
        </div>
      </section>

      <EndcapShell cta={{ label: "View My Resume", href: "/resume/" }} />
    </main>
  );
}
