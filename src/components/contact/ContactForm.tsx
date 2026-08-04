"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties, type FormEvent } from "react";
import { MdHelpOutline } from "react-icons/md";
import { buildContactMailto, type ContactFields } from "./mailto";

const EMPTY_FIELDS: ContactFields = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const TOOLTIP_VIEWPORT_MARGIN = 16;
const TOOLTIP_MAX_WIDTH = 320;
// The help image is 361x277; used to estimate tooltip height before it renders,
// so the tooltip can flip above the trigger when there isn't room below.
const TOOLTIP_IMAGE_ASPECT_RATIO = 277 / 361;

const INPUT_CLASS =
  "w-full border-0 border-b border-black/40 bg-transparent px-0 pt-6 pb-2 text-base text-black outline-none transition-colors placeholder:text-transparent focus:border-brand-blue focus:ring-0 peer";
const LABEL_CLASS =
  "pointer-events-none absolute top-1 left-0 text-xs text-black/60 transition-all peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-brand-blue";

export default function ContactForm({ contactEmail }: { contactEmail: string }) {
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>();

  function updateField(field: keyof ContactFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  function positionTooltip() {
    const button = helpButtonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const width = Math.min(
      TOOLTIP_MAX_WIDTH,
      window.innerWidth - TOOLTIP_VIEWPORT_MARGIN * 2,
    );
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, TOOLTIP_VIEWPORT_MARGIN),
      window.innerWidth - width - TOOLTIP_VIEWPORT_MARGIN,
    );
    const estimatedHeight = width * TOOLTIP_IMAGE_ASPECT_RATIO + 32;
    const spaceBelow = window.innerHeight - rect.bottom - TOOLTIP_VIEWPORT_MARGIN;
    const top =
      spaceBelow >= estimatedHeight
        ? rect.bottom + 8
        : Math.max(rect.top - estimatedHeight - 8, TOOLTIP_VIEWPORT_MARGIN);

    setTooltipStyle({ top, left, width });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!event.currentTarget.reportValidity()) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const submittedFields: ContactFields = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    window.open(
      buildContactMailto(contactEmail, submittedFields),
      "_blank",
      "noopener,noreferrer",
    );
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
          className="shadow-cta inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded bg-brand-blue px-8 py-3 text-lg font-medium text-white transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-reduce:transform-none sm:w-auto sm:min-w-48"
        >
          Open email draft
        </button>
        <button
          type="reset"
          className="shadow-cta inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded bg-brand-yellow px-8 py-3 text-lg font-medium text-slate-900 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue motion-reduce:transform-none sm:w-auto"
        >
          Clear
        </button>
      </div>

      <p className="mt-6 text-sm leading-6 text-slate-600">
        If no email app opens{" "}
        <span className="group relative inline-flex align-middle">
          <button
            ref={helpButtonRef}
            type="button"
            aria-label="How to let webmail open email links"
            aria-describedby="webmail-handler-help"
            onMouseEnter={positionTooltip}
            onFocus={positionTooltip}
            className="inline-flex size-6 cursor-help items-center justify-center rounded-full text-lg text-brand-blue hover:bg-brand-blue/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            <MdHelpOutline aria-hidden="true" />
          </button>
          <span
            id="webmail-handler-help"
            role="tooltip"
            style={tooltipStyle}
            className="invisible fixed z-[60] max-h-[calc(100vh-2rem)] overflow-auto rounded-lg border border-slate-300 bg-white p-2 opacity-0 shadow-2xl transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
          >
            <span className="sr-only">
              In your browser, allow your preferred webmail service to open email links.
            </span>
            <Image
              src="/assets/setup-webmail-as-default-handler-for-mailto.png"
              alt="Chrome prompt asking whether mail.google.com may open all email links, with Allow selected"
              width={361}
              height={277}
              unoptimized
              className="h-auto w-full rounded"
            />
          </span>
        </span>, email{" "}
        <a
          href={`mailto:${contactEmail}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-blue underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          {contactEmail}
          <span className="sr-only"> (opens in a new window)</span>
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
