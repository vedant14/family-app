import { IconCirclePlusFilled } from "~/components/ui/icons";
import { useEffect } from "react";
import { Form, Link } from "react-router";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog } from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { SourceForm } from "~/dashboard/create-source-form";
import { formatDate, parseCookies } from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";
import { useDialogStore } from "~/utils/store";

export async function loader({ params }) {
  const transactions = await prisma.ledger.findMany({
    select: {
      id: true,
      date: true,
      transactionTypeExtract: true,
      emailId: true,
      emailSubject: true,
      body: true,
      amountExtract: true,
      payeeExtract: true,
      category: {
        select: {
          categoryName: true,
        },
      },
      user: {
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
      source: {
        select: {
          sourceName: true,
        },
      },
    },
    where: {
      user: {
        team: {
          id: {
            equals: Number(params.teamId),
          },
        },
      },
    },
  });
  return transactions;
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function Product({ loaderData }) {
  const transactions = loaderData;
  return (
    <div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-left">Category</TableHead>
              <TableHead className="text-left">Amount</TableHead>
              <TableHead className="text-left">Merchant</TableHead>
              <TableHead className="text-left">Source Name</TableHead>
              <TableHead className="text-left">User</TableHead>
              <TableHead className="text-left">Subject</TableHead>
              <TableHead className="text-center">...</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((item, i) => (
              <TableRow
                key={item.id}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <TableCell>{formatDate(item.date)}</TableCell>
                <TableCell>{item.transactionTypeExtract}</TableCell>
                <TableCell>{item.category?.categoryName}</TableCell>
                <TableCell>{item.amountExtract}</TableCell>
                <TableCell>{item.payeeExtract}</TableCell>
                <TableCell>{item.source.sourceName}</TableCell>
                <TableCell>{item.user.user.email}</TableCell>
                <TableCell>{item.emailSubject}</TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    to={`https://mail.google.com/mail/#inbox/${item.emailId}`}
                    className="text-indigo-600 hover:text-indigo-900"
                    target="_blank"
                  >
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
