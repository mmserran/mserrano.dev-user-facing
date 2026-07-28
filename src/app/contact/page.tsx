import type { Metadata } from "next";
import ContactForm from "@/components/contact/ContactForm";
import EndcapShell from "@/components/illustration/EndcapShell";
import PageTitle from "@/components/typography/PageTitle";
import { getContactEmail } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact | Mark Serrano",
  description: "Get in touch with Mark Serrano.",
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

      <div className="flex justify-center px-4 pb-16">
        <a
          href="/resume/"
          className="inline-flex min-h-12 min-w-56 items-center justify-center rounded-sm border border-slate-300 bg-white px-7 py-3 text-lg font-light text-slate-700 shadow-lg transition-[color,transform,box-shadow] hover:-translate-y-0.5 hover:text-brand-blue hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-reduce:transform-none"
        >
          View My Resume
        </a>
      </div>

      <EndcapShell />
    </main>
  );
}
