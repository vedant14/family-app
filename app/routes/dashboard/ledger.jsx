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
import { TableCells } from "~/components/ui/tableCells";

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
    orderBy: {
      date: "desc",
    },
  });
  const categories = await prisma.category.findMany({
    where: {
      teamId: {
        equals: Number(params.teamId),
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return { transactions, categories };
}

export async function action({ request, params }) {
  let formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "edit") {
    const ledgerId = Number(formData.get("id"));
    let data = Object.fromEntries(formData);
    const { transactionTypeExtract, amountExtract, payeeExtract } = data;
    const source = await prisma.ledger.update({
      where: { id: ledgerId },
      data: {
        status: "EXTRACTED",
        transactionTypeExtract,
        amountExtract: Number(amountExtract),
        payeeExtract,
      },
    });
    return true;
  }
}
export function HydrateFallback() {
  return <div>Loading...</div>;
}

const LedgerRow = ({ item, i, categories }) => {
  const formId = `edit-form-${item.id}`;
  return (
    <TableRow key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
      <TableCell>{formatDate(item.date)}</TableCell>
      <TableCell className="p-0 w-[500px]">
        <select
          name="transactionTypeExtract"
          form={formId}
          className="h-full min-h-[38px] px-4 py-2 w-full border-0 focus:outline-none"
          defaultValue={item.transactionTypeExtract}
        >
          <option value="" disabled>
            Select type
          </option>
          <option value="EXPENSE">EXPENSE</option>
          <option value="INCOME">INCOME</option>
        </select>
      </TableCell>
      <TableCell className="p-0">
        <select
          name="categoryId"
          form={formId}
          className="h-full min-h-[38px] px-4 py-2 w-full border-0 focus:outline-none"
          defaultValue={item.category?.categoryName || ""}
        >
          <option value="" disabled>
            Select category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.categoryName}
            </option>
          ))}
        </select>
      </TableCell>
      <TableCells.Input
        type="number"
        formId={formId}
        name="amountExtract"
        defaultValue={item.amountExtract}
      />
      <TableCells.Input
        formId={formId}
        name="payeeExtract"
        defaultValue={item.payeeExtract}
      />
      <TableCell>{item.source.sourceName}</TableCell>
      <TableCell>{item.user.user.email}</TableCell>
      <TableCell>{item.emailSubject}</TableCell>
      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex space-x-2">
        <Form method="post" id={formId}>
          <input type="hidden" name="id" value={item.id} />
          <Button
            name="intent"
            value="edit"
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground min-w-8"
          >
            <span>Save</span>
          </Button>
        </Form>
        <Link
          to={`https://mail.google.com/mail/#inbox/${item.emailId}`}
          className="text-indigo-600 hover:text-indigo-900"
          target="_blank"
        >
          <Button className="bg-amber-600 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground min-w-8">
            View
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
};

export default function Product({ loaderData }) {
  const { transactions, categories } = loaderData;
  return (
    <div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="min-w-[150px]">Type</TableHead>
              <TableHead className="min-w-[200px]">Category</TableHead>
              <TableHead className="min-w-[150px]">Amount</TableHead>
              <TableHead className="min-w-[200px]">Merchant</TableHead>
              <TableHead className="text-left">Source Name</TableHead>
              <TableHead className="text-left">User</TableHead>
              <TableHead className="text-left">Subject</TableHead>
              <TableHead className="text-center">...</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((item, i) => (
              <LedgerRow item={item} i={i} key={i} categories={categories} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
