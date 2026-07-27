"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

export default function AddClientForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonEmail, setContactPersonEmail] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [contactError, setContactError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (name.trim() === "") {
      setNameError("Company name is required.");
      return;
    }

    if (contactPersonEmail.trim() === "" && contactPersonPhone.trim() === "") {
      setContactError("At least one of email or phone must be provided.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contactPersonName,
          contactPersonEmail,
          contactPersonPhone,
        }),
      });

      if (res.ok) {
        setName("");
        setContactPersonName("");
        setContactPersonEmail("");
        setContactPersonPhone("");
        setIsOpen(false);
        toast.success("Client created.");
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong.");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-base font-semibold text-foreground">
          New Client
        </span>
        <ChevronDown
          size={18}
          className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 border-t border-border px-4 py-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Company name <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="Acme Corp"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); }}
              className={inputClass}
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="contactPersonName"
              className="text-sm font-medium text-foreground"
            >
              Contact name
            </label>
            <input
              id="contactPersonName"
              type="text"
              placeholder="Jane Doe"
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="contactPersonEmail"
              className="text-sm font-medium text-foreground"
            >
              Contact email{" "}
              <span className="text-xs text-muted-foreground">
                (at least one of email or phone required)
              </span>
            </label>
            <input
              id="contactPersonEmail"
              type="email"
              placeholder="jane@acme.com"
              value={contactPersonEmail}
              onChange={(e) => { setContactPersonEmail(e.target.value); setContactError(""); }}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="contactPersonPhone"
              className="text-sm font-medium text-foreground"
            >
              Contact phone
            </label>
            <input
              id="contactPersonPhone"
              type="tel"
              placeholder="+1234567890"
              value={contactPersonPhone}
              onChange={(e) => { setContactPersonPhone(e.target.value); setContactError(""); }}
              className={inputClass}
            />
            {contactError && (
              <p className="text-sm text-destructive">{contactError}</p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
