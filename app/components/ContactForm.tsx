"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, Send } from "lucide-react";
import { contactFieldsSchema, type ContactField } from "@/lib/contactSchema";

type Labels = {
  messageTitle: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  subjectPlaceholder: string;
  messagePlaceholder: string;
  send: string;
  sending: string;
  sent: string;
  error: string;
  deliveryNote: string;
  validationName: string;
  validationEmail: string;
  validationSubject: string;
  validationMessage: string;
};

export default function ContactForm({ labels }: { labels: Labels }) {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [touched, setTouched] = useState<Partial<Record<ContactField, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});

  function validateField(field: ContactField, value: string) {
    const result = contactFieldsSchema.shape[field].safeParse(value);
    setErrors((current) => {
      const next = { ...current };
      if (result.success) delete next[field];
      else next[field] = labels[`validation${field[0].toUpperCase()}${field.slice(1)}` as "validationName" | "validationEmail" | "validationSubject" | "validationMessage"];
      return next;
    });
  }

  function onFieldBlur(field: ContactField, value: string) {
    setTouched((current) => ({ ...current, [field]: true }));
    validateField(field, value);
  }

  function onFieldChange(field: ContactField, value: string) {
    if (touched[field]) validateField(field, value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    setStatus("idle");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      if (!response.ok) throw new Error("Message delivery failed");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = "mt-2 w-full min-w-0 border border-[var(--cream3)] bg-white px-3 py-3 text-base text-[var(--dark)] outline-none transition-colors placeholder:text-[var(--gray)]/70 focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] sm:text-sm";

  return (
    <section aria-labelledby="contact-form-title" className="border-t-2 border-[var(--red)] bg-white p-5 sm:p-7 lg:p-8">
      <h2 id="contact-form-title" className="font-serif text-2xl font-bold text-[var(--dark)]">{labels.messageTitle}</h2>
      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
          <label>Leave this field blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mid)]">
            {labels.name}
            <input name="name" type="text" autoComplete="name" placeholder={labels.namePlaceholder} required minLength={2} maxLength={100} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "contact-name-error" : undefined} onBlur={(event) => onFieldBlur("name", event.currentTarget.value)} onChange={(event) => onFieldChange("name", event.currentTarget.value)} className={fieldClass} />
            {errors.name && <span id="contact-name-error" className="mt-1 block text-xs font-normal normal-case tracking-normal text-red-700">{errors.name}</span>}
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mid)]">
            {labels.email}
            <input name="email" type="email" autoComplete="email" placeholder={labels.emailPlaceholder} required maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "contact-email-error" : undefined} onBlur={(event) => onFieldBlur("email", event.currentTarget.value)} onChange={(event) => onFieldChange("email", event.currentTarget.value)} className={fieldClass} />
            {errors.email && <span id="contact-email-error" className="mt-1 block text-xs font-normal normal-case tracking-normal text-red-700">{errors.email}</span>}
          </label>
        </div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mid)]">
          {labels.subject}
          <input name="subject" type="text" placeholder={labels.subjectPlaceholder} required minLength={2} maxLength={160} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? "contact-subject-error" : undefined} onBlur={(event) => onFieldBlur("subject", event.currentTarget.value)} onChange={(event) => onFieldChange("subject", event.currentTarget.value)} className={fieldClass} />
          {errors.subject && <span id="contact-subject-error" className="mt-1 block text-xs font-normal normal-case tracking-normal text-red-700">{errors.subject}</span>}
        </label>
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--mid)]">
          {labels.message}
          <textarea name="message" placeholder={labels.messagePlaceholder} required minLength={10} maxLength={3000} rows={6} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : undefined} onBlur={(event) => onFieldBlur("message", event.currentTarget.value)} onChange={(event) => onFieldChange("message", event.currentTarget.value)} className={`${fieldClass} resize-y leading-relaxed`} />
          {errors.message && <span id="contact-message-error" className="mt-1 block text-xs font-normal normal-case tracking-normal text-red-700">{errors.message}</span>}
        </label>
        <div className="flex flex-col items-start gap-3 border-t border-[var(--cream3)] pt-5">
          <button type="submit" disabled={submitting} className="inline-flex min-h-12 items-center gap-3 bg-[var(--red)] px-5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[var(--red-dk)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:cursor-wait disabled:opacity-60">
            <Send aria-hidden="true" className="size-4" />{submitting ? labels.sending : labels.send}<ArrowUpRight aria-hidden="true" className="size-4" />
          </button>
          <p aria-live="polite" role={status === "error" ? "alert" : "status"} className={`max-w-md text-xs leading-relaxed ${status === "error" ? "text-red-700" : "text-[var(--gray)]"}`}>
            {status === "sent" ? labels.sent : status === "error" ? labels.error : labels.deliveryNote}
          </p>
        </div>
      </form>
    </section>
  );
}
