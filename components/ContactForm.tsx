"use client";

import { FormEvent, useState } from "react";

const enquiryTypes = ["Request", "Opinion", "Suggestion", "Complaint"];

export function ContactForm() {
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "").trim();
    const name = String(data.get("name") ?? "").trim();
    if (!email.includes("@") || !message || !name) {
      setError("Name, a valid email address and a message are required.");
      setSent("");
      return;
    }
    setError("");
    const summary = [
      `Website: ${data.get("website") || "—"}`,
      `Name: ${name} ${data.get("surname") || ""}`.trim(),
      `Email: ${email}`,
      `Phone: ${data.get("phone") || "—"}`,
      `Type: ${data.get("type")}`,
      "",
      message,
    ].join("\n");
    setSent(summary);
  }

  if (sent) {
    return (
      <div className="notice">
        <h2>Thank you</h2>
        <p>
          The form is received on this page. It is not emailed yet, because the WordPress form does not publish the inbox address. Copy the message below until that address is connected.
        </p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{sent}</pre>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <p>Brethren; please fill in the form below for your enquiries, opinions, suggestions and complaints to contact with us!</p>
      <label className="field">
        <span>Website URL</span>
        <input name="website" type="url" placeholder="https://" />
      </label>
      <div className="row-2">
        <label className="field">
          <span>Name <i className="req">*</i></span>
          <input name="name" required />
        </label>
        <label className="field">
          <span>Surname</span>
          <input name="surname" />
        </label>
      </div>
      <div className="row-2">
        <label className="field">
          <span>Your email address <i className="req">*</i></span>
          <input name="email" type="email" required />
        </label>
        <label className="field">
          <span>Contact phone number</span>
          <input name="phone" type="tel" />
        </label>
      </div>
      <label className="field">
        <span>Please select the type of your enquiry <i className="req">*</i></span>
        <select name="type" defaultValue="Request">
          {enquiryTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Your message <i className="req">*</i></span>
        <textarea name="message" rows={6} required />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button type="submit">Submit</button>
    </form>
  );
}
