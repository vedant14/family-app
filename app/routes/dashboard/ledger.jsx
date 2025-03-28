import { IconCirclePlusFilled } from "@tabler/icons-react";
import { useEffect } from "react";
import { Form } from "react-router";
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
import { findUserByEmail, verifyIdToken } from "~/utils/authHelpers";
import { formatDate, parseCookies } from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";
import { useDialogStore } from "~/utils/store";

export async function action({ request }) {
  let formData = await request.formData();
  const header = Object.fromEntries(request.headers);
  const cookie = parseCookies(header.cookie);
  let data = Object.fromEntries(formData);
  const {
    sourceName,
    sourceType,
    label,
    subject,
    fromEmail,
    amountRegex,
    amountRegexBackup,
    payeeRegex,
    payeeRegexBackup,
    defaultCategory,
    defaultType,
    rulePriority = 1,
  } = data;
  const verifyUser = await verifyIdToken(cookie.user);
  const user = await findUserByEmail(verifyUser.email);
  if (!sourceName || !defaultType) {
    return { error: "What is required, is required!" };
  }
  if (!user) {
    return { error: "User not found" };
  }

  let queryParts = [];

  if (subject) {
    queryParts.push(`subject:${subject}`);
  }

  if (label) {
    queryParts.push(`label:${label}`);
  }
  if (fromEmail) {
    queryParts.push(`from:${fromEmail}`);
  }

  const query = queryParts.join(" ");
  const source = await prisma.source.create({
    data: {
      sourceName,
      query,
      sourceType,
      userId: user.id,
      amountRegex,
      amountRegexBackup,
      payeeRegex,
      payeeRegexBackup,
      defaultCategory,
      defaultType,
      rulePriority,
    },
  });
  return source;
}

export async function loader() {
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
      user: {
        select: {
          email: true,
        },
      },
      source: {
        select: {
          sourceName: true,
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
      {/* <div className="flex justify-end mb-4">
        <Dialog open={open}>
          <SourceForm />
          <Button
            tooltip="Quick Create"
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            onClick={toggleOpen}
          >
            <IconCirclePlusFilled />
            <span>Add Source</span>
          </Button>
        </Dialog>
      </div> */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-left">Category</TableHead>
              <TableHead className="text-left">Amount</TableHead>
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
                <TableCell>{item.categoryExtract}</TableCell>
                <TableCell>{item.amountExtract}</TableCell>
                <TableCell>{item.source.sourceName}</TableCell>
                <TableCell>{item.user.email}</TableCell>
                <TableCell>{item.emailSubject}</TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="#" className="text-indigo-600 hover:text-indigo-900">
                    Edit
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
