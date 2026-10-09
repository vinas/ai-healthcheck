"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/ui/collapsible";

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
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="max-w-lg rounded-lg border border-border"
    >
      <CollapsibleTrigger>
        <span className="text-base font-semibold text-foreground">
          New Client
        </span>
        <ChevronDown
          size={18}
          className="text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-180"
        />
      </CollapsibleTrigger>

      <CollapsiblePanel>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 border-t border-border px-4 py-4"
        >
          <FormField
            label={<>Company name <span className="text-destructive">*</span></>}
            htmlFor="name"
            error={nameError}
          >
            <Input
              id="name"
              type="text"
              placeholder="Acme Corp"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); }}
            />
          </FormField>

          <FormField label="Contact name" htmlFor="contactPersonName">
            <Input
              id="contactPersonName"
              type="text"
              placeholder="Jane Doe"
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
            />
          </FormField>

          <FormField
            label={
              <>
                Contact email{" "}
                <span className="text-xs text-muted-foreground">
                  (at least one of email or phone required)
                </span>
              </>
            }
            htmlFor="contactPersonEmail"
          >
            <Input
              id="contactPersonEmail"
              type="email"
              placeholder="jane@acme.com"
              value={contactPersonEmail}
              onChange={(e) => { setContactPersonEmail(e.target.value); setContactError(""); }}
            />
          </FormField>

          <FormField label="Contact phone" htmlFor="contactPersonPhone" error={contactError}>
            <Input
              id="contactPersonPhone"
              type="tel"
              placeholder="+1234567890"
              value={contactPersonPhone}
              onChange={(e) => { setContactPersonPhone(e.target.value); setContactError(""); }}
            />
          </FormField>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </CollapsiblePanel>
    </Collapsible>
  );
}
