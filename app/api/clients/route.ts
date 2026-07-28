import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

const VALID_SORT_FIELDS = [
  "id", "name", "contactPersonName", "contactPersonEmail",
  "contactPersonPhone", "uniqueKey", "keyUsedAt",
] as const;
type SortField = typeof VALID_SORT_FIELDS[number];

export async function GET(req: NextRequest) {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const params = req.nextUrl.searchParams;
    const search = params.get("search")?.trim() ?? "";
    const rawSortBy = params.get("sortBy") ?? "id";
    const sortBy: SortField = VALID_SORT_FIELDS.includes(rawSortBy as SortField)
      ? (rawSortBy as SortField)
      : "id";
    const sortDir = params.get("sortDir") === "desc" ? "desc" : "asc";
    const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
    const rawPageSize = params.get("pageSize") ?? "10";
    const isAll = rawPageSize === "all";
    const pageSize = isAll ? 0 : Math.max(1, parseInt(rawPageSize, 10) || 10);

    const where: Prisma.ClientWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { contactPersonName: { contains: search, mode: "insensitive" } },
            { contactPersonEmail: { contains: search, mode: "insensitive" } },
            { contactPersonPhone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const skip = isAll ? undefined : (page - 1) * pageSize;
    const take = isAll ? undefined : pageSize;

    const [data, total] = await prisma.$transaction([
      prisma.client.findMany({ where, orderBy: { [sortBy]: sortDir }, skip, take }),
      prisma.client.count({ where }),
    ]);

    const totalPages = isAll ? 1 : Math.ceil(total / pageSize);

    return NextResponse.json({ data, total, page: isAll ? 1 : page, pageSize: isAll ? total : pageSize, totalPages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const unauthorized = await requireAuth();
    if (unauthorized) return unauthorized;

    const { name, contactPersonName, contactPersonEmail, contactPersonPhone } =
      await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Error when trying to create a new client: name is required." },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: { name, contactPersonName, contactPersonEmail, contactPersonPhone },
    });

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Error when trying to create a new client: ${message}` },
      { status: 500 }
    );
  }
}
