"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

type Client = {
  id: number;
  name: string;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
  uniqueKey: string;
  keyUsedAt: string | null;
};

type SortField = keyof Client;
type SortDir = "asc" | "desc";
type PageSize = 10 | 20 | 50 | 100 | "all";

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "id", label: "ID" },
  { field: "name", label: "Name" },
  { field: "contactPersonName", label: "Contact Name" },
  { field: "contactPersonEmail", label: "Contact Email" },
  { field: "contactPersonPhone", label: "Contact Phone" },
  { field: "uniqueKey", label: "Unique Key" },
  { field: "keyUsedAt", label: "Key Used At" },
];

function formatKeyUsedAt(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatUniqueKey(value: string): string {
  return value.slice(0, 8);
}

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [loading, setLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch whenever params change
  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          search: debouncedSearch,
          sortBy,
          sortDir,
          page: String(page),
          pageSize: String(pageSize),
        });
        const res = await fetch(`/api/clients?${params}`);
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error ?? "Failed to load clients.");
          return;
        }
        const data = await res.json();
        setClients(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch {
        toast.error("An unexpected error occurred while loading clients.");
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [debouncedSearch, sortBy, sortDir, page, pageSize]);

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  const isAll = pageSize === "all";

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Search across all fields…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={inputClass}
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {COLUMNS.map(({ field, label }) => (
                <th
                  key={field}
                  className="px-4 py-2 text-left font-medium text-foreground"
                >
                  <button
                    type="button"
                    onClick={() => handleSort(field)}
                    className="inline-flex items-center gap-1 hover:text-foreground/70"
                  >
                    {label}
                    {sortBy === field ? (
                      sortDir === "asc" ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )
                    ) : (
                      <ChevronDown size={14} className="opacity-30" />
                    )}
                  </button>
                </th>
              ))}
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className={loading ? "opacity-50" : ""}>
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 1}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No clients found.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-2 text-foreground">{client.id}</td>
                  <td className="px-4 py-2 text-foreground">{client.name}</td>
                  <td className="px-4 py-2 text-foreground">{client.contactPersonName ?? "—"}</td>
                  <td className="px-4 py-2 text-foreground">{client.contactPersonEmail ?? "—"}</td>
                  <td className="px-4 py-2 text-foreground">{client.contactPersonPhone ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-foreground" title={client.uniqueKey}>
                    {formatUniqueKey(client.uniqueKey)}…
                  </td>
                  <td className="px-4 py-2 text-foreground">{formatKeyUsedAt(client.keyUsedAt)}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      title="Copy URL to clipboard"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/healthcheck/landing/${client.uniqueKey}`);
                        toast.success("URL copied to clipboard");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page:</span>
          <select
            value={String(pageSize)}
            onChange={(e) => {
              const v = e.target.value;
              setPageSize(v === "all" ? "all" : (Number(v) as PageSize));
              setPage(1);
            }}
            className={selectClass}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
            <option value="all">All</option>
          </select>
          <span>{total} total</span>
        </div>

        {!isAll && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1 || loading}
            >
              Prev
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages || loading}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || loading}
            >
              Last
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
