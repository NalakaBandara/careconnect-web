"use client";

import { useActionState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { contactAction, type ContactState } from "@/app/contact/actions";

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState<ContactState, FormData>(
    contactAction,
    {},
  );

  const errorFor = (name: string) => state.fields?.[name]?.[0];

  if (state.ok) {
    return (
      <div
        role="status"
        className="rounded-lg border border-border bg-background p-7 shadow-soft"
      >
        <h2 className="font-serif text-xl font-semibold">Thank you — message sent</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          We have your enquiry and will reply within two working days. If your question is
          urgent, please phone the office instead.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      // noValidate turns off the browser's own bubbles so our own messages,
      // which are tied to each field for screen readers, are the ones shown.
      noValidate
      className="space-y-5 rounded-lg border border-border bg-background p-7 shadow-soft"
    >
      {state.message && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <Field
        name="name"
        label="Name"
        autoComplete="name"
        defaultValue={state.values?.name}
        error={errorFor("name")}
      />
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={errorFor("email")}
      />
      <Field
        name="subject"
        label="Subject"
        defaultValue={state.values?.subject}
        error={errorFor("subject")}
      />

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          defaultValue={state.values?.message}
          aria-invalid={errorFor("message") ? true : undefined}
          aria-describedby={errorFor("message") ? "message-error" : undefined}
          className={
            "w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
            (errorFor("message") ? "border-destructive" : "border-input")
          }
        />
        {errorFor("message") && (
          <p id="message-error" className="text-sm text-destructive">
            {errorFor("message")}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending…" : "Submit"}
      </Button>

      <p className="text-sm text-muted-foreground">
        We never share your contact details with third parties.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  error,
  ...props
}: {
  name: string;
  label: string;
  error?: string;
} & React.ComponentProps<"input">) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={error ? "border-destructive" : ""}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
