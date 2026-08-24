"use client";

import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Copy, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { copyToClipboard } from "@/lib/utils";

type ClientKey = {
  id: number;
  uniqueKey: string;
  keyUsedAt: string | null;
  createdAt: string;
  narrative: { publishedAt: string | null } | null;
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
      <Input
        type="text"
        placeholder="Search across all fields…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {COLUMNS.map(({ field, label }) => (
                <TableHead key={field}>
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
                </TableHead>
              ))}
              <TableHead>Keys</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody className={loading ? "opacity-50" : ""}>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="py-6 text-center text-muted-foreground"
                >
                  No clients found.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <Fragment key={client.id}>
                  <TableRow>
                    <TableCell>{client.id}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.contactPersonName ?? "—"}</TableCell>
                    <TableCell>{client.contactPersonEmail ?? "—"}</TableCell>
                    <TableCell>{client.contactPersonPhone ?? "—"}</TableCell>
                    <TableCell>
                      {client.keys.length} key{client.keys.length === 1 ? "" : "s"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setExpandedId(expandedId === client.id ? null : client.id)
                          }
                        >
                          {expandedId === client.id ? "Hide" : "Assessments"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === client.id && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={COLUMN_COUNT} className="py-4">
                        <div className="flex flex-col gap-3">
                          {client.keys.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No keys yet.</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="px-2 py-1.5">
                                    Unique Key
                                  </TableHead>
                                  <TableHead className="px-2 py-1.5">
                                    Created At
                                  </TableHead>
                                  <TableHead className="px-2 py-1.5">
                                    Key Used At
                                  </TableHead>
                                  <TableHead className="px-2 py-1.5" />
                                </TableRow>
                              </TableHeader>
                              <TableBody>
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
                                  <TableRow key={key.id}>
                                    <TableCell className="px-2 py-1.5 font-mono">
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
                                    </TableCell>
                                    <TableCell className="px-2 py-1.5">
                                      {formatDateTime(key.createdAt)}
                                    </TableCell>
                                    <TableCell className="px-2 py-1.5">
                                      {formatDateTime(key.keyUsedAt)}
                                    </TableCell>
                                    <TableCell className="px-2 py-1.5">
                                      <div className="flex items-center gap-12">
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
                                        {key.keyUsedAt && (
                                          <a
                                            href={`/admin/narratives/${key.uniqueKey}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Write or edit the narrative content for this report"
                                            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                                          >
                                            <FileText size={15} />
                                            <span className="text-xs">
                                              {key.narrative ? "Edit narrative" : "Write narrative"}
                                            </span>
                                            {key.narrative?.publishedAt ? (
                                              <span className="rounded-md border border-green-200 bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-900">
                                                Published
                                              </span>
                                            ) : key.narrative ? (
                                              <span className="rounded-md border border-yellow-200 bg-yellow-50 px-1.5 py-0.5 text-[10px] font-medium text-yellow-900">
                                                Draft
                                              </span>
                                            ) : null}
                                          </a>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
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
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v: string | null) => {
              if (v === null) return;
              setPageSize(v === "all" ? "all" : (Number(v) as PageSize));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue>{(v: string) => (v === "all" ? "All" : v)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <span>{total} total</span>
        </div>

        {!isAll && (
          <div className="flex flex-wrap items-center gap-2">
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
