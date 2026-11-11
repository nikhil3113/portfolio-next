import { ContactActions } from "@/components/contact/ContactActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Contact } from "@prisma/client";

export const dynamic = "force-dynamic";

type ContactsResult = { ok: true; contacts: Contact[] } | { ok: false };

async function getContacts() {
  return prisma.contact.findMany({
    orderBy: { id: "desc" },
    take: 200,
  });
}

export default async function ContactInbox() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  let result: ContactsResult;
  try {
    result = { ok: true, contacts: await getContacts() };
  } catch (error) {
    console.error("Error fetching contacts:", error);
    result = { ok: false };
  }

  if (!result.ok) {
    return (
      <div className="mx-auto mt-8 max-w-5xl rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold text-foreground">Messages</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Could not load messages. Please try again.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/contact">Try again</Link>
        </Button>
      </div>
    );
  }

  const { contacts } = result;
  const unreadCount = contacts.filter((contact) => contact.isRead !== true).length;

  if (contacts.length === 0) {
    return (
      <div className="mx-auto mt-8 max-w-5xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="mt-3 text-muted-foreground">No messages yet.</p>
        <Button asChild className="mt-4">
          <Link href="/admin">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">
            {contacts.length} message{contacts.length === 1 ? "" : "s"},{" "}
            {unreadCount} unread
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin">Back to dashboard</Link>
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="hidden md:table-cell">Received</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => {
              const unread = contact.isRead !== true;
              return (
                <TableRow key={contact.id} className="hover:bg-muted transition">
                  <TableCell className="align-top">
                    <div className="font-medium text-foreground">
                      {contact.name}
                    </div>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-xs text-muted-foreground hover:text-accent-text"
                    >
                      {contact.email}
                    </a>
                  </TableCell>
                  <TableCell className="align-top">
                    <p
                      className="line-clamp-3 max-w-md whitespace-pre-line text-sm text-muted-foreground"
                      title={contact.message}
                    >
                      {contact.message}
                    </p>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap align-top text-xs text-muted-foreground md:table-cell">
                    {contact.createdAt?.toLocaleDateString() ?? "—"}
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={unread ? "default" : "secondary"}>
                      {unread ? "Unread" : "Read"}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <ContactActions id={contact.id} isRead={!unread} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
