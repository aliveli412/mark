import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageBanner } from "@/components/PageBanner";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <>
      <PageBanner title="Contact Us" />
      <div className="wrap page">
        <ContactForm />
      </div>
    </>
  );
}
