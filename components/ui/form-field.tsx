import type { ReactNode } from "react"

type FormFieldProps = {
  label: ReactNode
  htmlFor?: string
  error?: string
  children: ReactNode
  as?: "label" | "span"
  gap?: "gap-1.5" | "gap-2"
}

function FormField({
  label,
  htmlFor,
  error,
  children,
  as = "label",
  gap = "gap-1.5",
}: FormFieldProps) {
  return (
    <div className={`flex flex-col ${gap}`}>
      {as === "span" ? (
        <span className="text-sm font-medium text-foreground">{label}</span>
      ) : (
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export { FormField }
