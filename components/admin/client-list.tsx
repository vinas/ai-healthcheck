"use client";

import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/utils";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring";

type ClientKey = {
  id: number;
  uniqueKey: string;
  keyUsedAt: string | null;
  createdAt: string;
};

type Client = {
  id: number;
  name: string;
  contactPersonName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;
  keys: ClientKey[];
};

type SortField = keyof Omit<Client, "keys">;
type SortDir = "asc" | "desc";
type PageSize = 10 | 20 | 50 | 100 | "all";

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "id", label: "ID" },
  { field: "name", label: "Name" },
  { field: "contactPersonName", label: "Contact Name" },
  { field: "contactPersonEmail", label: "Contact Email" },
  { field: "contactPersonPhone", label: "Contact Phone" },
];

const COLUMN_COUNT = COLUMNS.length + 2; // + Keys count column + actions column

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
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

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

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

  async function handleGenerateKey(clientId: number) {
    setGeneratingId(clientId);
    try {
      const res = await fetch(`/api/clients/${clientId}/keys`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, keys: [data, ...c.keys] } : c))
        );
        toast.success("New key generated.");
      } else {
        toast.error(data.error ?? "Something went wrong.");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setGeneratingId(null);
    }
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
              <th className="px-4 py-2 text-left font-medium text-foreground">Keys</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className={loading ? "opacity-50" : ""}>
            {clients.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMN_COUNT}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No clients found.
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <Fragment key={client.id}>
                  <tr className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 text-foreground">{client.id}</td>
                    <td className="px-4 py-2 text-foreground">{client.name}</td>
                    <td className="px-4 py-2 text-foreground">{client.contactPersonName ?? "—"}</td>
                    <td className="px-4 py-2 text-foreground">{client.contactPersonEmail ?? "—"}</td>
                    <td className="px-4 py-2 text-foreground">{client.contactPersonPhone ?? "—"}</td>
                    <td className="px-4 py-2 text-foreground">
                      {client.keys.length} key{client.keys.length === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setExpandedId(expandedId === client.id ? null : client.id)
                          }
                        >
                          {expandedId === client.id ? "Hide" : "Keys"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === client.id && (
                    <tr className="border-b border-border last:border-0 bg-muted/20">
                      <td colSpan={COLUMN_COUNT} className="px-4 py-4">
                        <div className="flex flex-col gap-3">
                          {client.keys.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No keys yet.</p>
                          ) : (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="px-2 py-1.5 text-left font-medium text-foreground">
                                    Unique Key
                                  </th>
                                  <th className="px-2 py-1.5 text-left font-medium text-foreground">
                                    Created At
                                  </th>
                                  <th className="px-2 py-1.5 text-left font-medium text-foreground">
                                    Key Used At
                                  </th>
                                  <th className="px-2 py-1.5" />
                                </tr>
                              </thead>
                              <tbody>
                                {client.keys.map((key) => {
                                  const copyKey = async () => {
                                    const success = await copyToClipboard(key.uniqueKey);
                                    if (success) {
                                      toast.success("Key copied to clipboard");
                                      return;
                                    }
                                    toast.error("Couldn't copy key to clipboard");
                                  };
                                  return (
                                  <tr key={key.id} className="border-b border-border last:border-0">
                                    <td className="px-2 py-1.5 font-mono text-foreground">
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          title="Copy the unique key to clipboard"
                                          onClick={copyKey}
                                          className="hover:text-foreground/70"
                                        >
                                          {key.uniqueKey}
                                        </button>
                                        <button
                                          type="button"
                                          title="Copy the unique key to clipboard"
                                          onClick={copyKey}
                                          className="text-muted-foreground hover:text-foreground"
                                        >
                                          <Copy size={13} />
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-2 py-1.5 text-foreground">
                                      {formatDateTime(key.createdAt)}
                                    </td>
                                    <td className="px-2 py-1.5 text-foreground">
                                      {formatDateTime(key.keyUsedAt)}
                                    </td>
                                    <td className="px-2 py-1.5">
                                      <div className="flex items-center gap-8">
                                        <button
                                          type="button"
                                          title="Copy the assessment landing page URL to clipboard"
                                          onClick={async () => {
                                            const success = await copyToClipboard(
                                              `${window.location.origin}/healthcheck/landing/${key.uniqueKey}`
                                            );
                                            if (success) {
                                              toast.success("URL copied to clipboard");
                                              return;
                                            }
                                            toast.error("Couldn't copy URL to clipboard");
                                          }}
                                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                                        >
                                          <Copy size={15} />
                                          <span className="text-xs">Copy assessment link</span>
                                        </button>
                                        {key.keyUsedAt && (
                                          <a
                                            href={`/healthcheck/report/${key.uniqueKey}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Open the generated report in a new tab"
                                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                                          >
                                            <ExternalLink size={15} />
                                            <span className="text-xs">Open report</span>
                                          </a>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={generatingId === client.id}
                              onClick={() => handleGenerateKey(client.id)}
                            >
                              {generatingId === client.id ? "Generating…" : "Generate new key"}
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
