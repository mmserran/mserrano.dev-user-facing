"use client";

import { useState, type FormEvent } from "react";
import { buildContactMailto, type ContactFields } from "./mailto";

const EMPTY_FIELDS: ContactFields = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const INPUT_CLASS =
  "w-full border-0 border-b border-black/40 bg-transparent px-0 pt-6 pb-2 text-base text-black outline-none transition-colors placeholder:text-transparent focus:border-brand-blue focus:ring-0 peer";
const LABEL_CLASS =
  "pointer-events-none absolute top-1 left-0 text-xs text-black/60 transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-brand-blue";

export default function ContactForm({ contactEmail }: { contactEmail: string }) {
  const [fields, setFields] = useState(EMPTY_FIELDS);

  function updateField(field: keyof ContactFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!event.currentTarget.reportValidity()) {
      return;
    }

    window.location.assign(buildContactMailto(contactEmail, fields));
  }

  function handleReset() {
    setFields(EMPTY_FIELDS);
  }

  return (
    <form onSubmit={handleSubmit} onReset={handleReset} noValidate={false}>
      <div className="grid gap-6">
        <FormInput
          id="contact-name"
          label="Your Name"
          value={fields.name}
          onChange={(value) => updateField("name", value)}
          autoComplete="name"
          required
        />
        <FormInput
          id="contact-email"
          label="Your E-mail"
          value={fields.email}
          onChange={(value) => updateField("email", value)}
          type="email"
          autoComplete="email"
          required
        />
        <FormInput
          id="contact-subject"
          label="Subject"
          value={fields.subject}
          onChange={(value) => updateField("subject", value)}
        />
        <div className="relative">
          <textarea
            id="contact-message"
            name="message"
            value={fields.message}
            onChange={(event) => updateField("message", event.target.value)}
            placeholder=" "
            rows={5}
            required
            className={`${INPUT_CLASS} min-h-32 resize-y`}
          />
          <label htmlFor="contact-message" className={LABEL_CLASS}>
            Your Message <span aria-hidden="true">*</span>
          </label>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-600">
        This opens your email app with a draft. Review and send it there.
      </p>

      <div className="mt-6 flex w-full flex-col gap-4 sm:flex-row sm:justify-end">
        <button
          type="submit"
          className="shadow-cta inline-flex min-h-12 w-full items-center justify-center rounded bg-brand-blue px-8 py-3 text-lg font-medium text-white transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-reduce:transform-none sm:w-auto sm:min-w-48"
        >
          Open email draft
        </button>
        <button
          type="reset"
          className="shadow-cta inline-flex min-h-12 w-full items-center justify-center rounded bg-brand-yellow px-8 py-3 text-lg font-medium text-slate-900 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-reduce:transform-none sm:w-auto"
        >
          Clear
        </button>
      </div>

      <p className="mt-6 text-sm leading-6 text-slate-600">
        If no email app opens, email{" "}
        <a
          href={`mailto:${contactEmail}`}
          className="font-medium text-brand-blue underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          {contactEmail}
        </a>
        .
      </p>
    </form>
  );
}

function FormInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email";
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        name={id.replace("contact-", "")}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder=" "
        required={required}
        className={INPUT_CLASS}
      />
      <label htmlFor={id} className={LABEL_CLASS}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
    </div>
  );
}
