import { IconDotsVertical } from "~/components/ui/icons";
import { useEffect } from "react";
import { Form, Link } from "react-router";
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
import {
  classNames,
  formatDate,
  getInitials,
  parseCookies,
} from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";
import { useDialogStore } from "~/utils/store";
import { TableCells } from "~/components/ui/tableCells";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

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
          id: true,
          categoryName: true,
        },
      },
      user: {
        select: {
          user: {
            select: {
              email: true,
              name: true,
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
        teamId: {
          equals: Number(params.teamId),
        },
      },
      status: {
        in: ["CREATED", "EXTRACTED", "MANUAL"],
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
  const formData = await request.formData();
  const intent = formData.get("intent");
  const ledgerId = Number(formData.get("id"));

  const updateData = {
    edit: async () => {
      const {
        transactionTypeExtract,
        amountExtract,
        payeeExtract,
        categoryId,
      } = Object.fromEntries(formData);
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: {
          status: "MANUAL",
          transactionTypeExtract,
          categoryId: Number(categoryId),
          amountExtract: Number(amountExtract),
          payeeExtract,
        },
      });
    },
    ignore: async () =>
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: { status: "IGNORE" },
      }),
    income: async () =>
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: { transactionTypeExtract: "INCOME" },
      }),
    expense: async () =>
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: { transactionTypeExtract: "EXPENSE" },
      }),
    duplicate: async () =>
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: { status: "DUPLICATE" },
      }),
    junk: async () =>
      await prisma.ledger.update({
        where: { id: ledgerId },
        data: { status: "JUNK" },
      }),
  };

  if (updateData[intent]) {
    await updateData[intent]();
  }
}
export function HydrateFallback() {
  return <div>Loading...</div>;
}

const LedgerRow = ({ item, i, categories }) => {
  const formId = `edit-form-${item.id}`;
  return (
    <TableRow
      key={item.id}
      id={item.id}
      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
    >
      <TableCell className="w-32">{formatDate(item.date)}</TableCell>
      <TableCell className="p-0 w-48">
        <select
          name="categoryId"
          form={formId}
          className="h-full px-4 py-0 border-0 focus:outline-none"
          defaultValue={item.category?.id || ""}
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
        className={classNames(
          item.transactionTypeExtract === "EXPENSE"
            ? "text-red-500 before:content-['s']"
            : "text-green-700"
        )}
        name="amountExtract"
        defaultValue={item.amountExtract}
      />
      <TableCells.Input
        formId={formId}
        name="payeeExtract"
        defaultValue={item.payeeExtract}
      />
      <TableCell className="w-8">
        <div className="h-8 w-8 rounded-full bg-gray-300 flex">
          <div className="m-auto">{getInitials(item.user.user.name)}</div>
        </div>
      </TableCell>
      <td className="flex space-x-2 py-2 px-12">
        <Form method="post" id={formId}>
          <input type="hidden" name="id" value={item.id} />
          <button
            name="intent"
            value="edit"
            type="submit"
            size="sm"
            className="bg-gray-400 text-primary-foreground hover:bg-primary/70 hover:text-primary-foreground min-w-8 px-4 rounded-md cursor-pointer"
          >
            <span>Save</span>
          </button>
        </Form>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <IconDotsVertical className="text-gray-300" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Transaction ID: {item.id}</DropdownMenuItem>
            <DropdownMenuItem>
              Source Type: {item.source.sourceName}
            </DropdownMenuItem>

            {item.emailId && (
              <>
                <DropdownMenuItem>
                  Email: {item.user.user.email}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Email Subject : {item.emailSubject}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link
                    to={`https://mail.google.com/mail/#inbox/${item.emailId}`}
                    target="_blank"
                  >
                    View Email
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            {item.transactionTypeExtract === "EXPENSE" ? (
              <DropdownMenuItem>
                <Form method="post" className="w-full">
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    name="intent"
                    value="income"
                    className="cursor-pointer w-full text-left"
                  >
                    Mark as Income
                  </button>
                </Form>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
                <Form method="post" className="w-full">
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    name="intent"
                    value="expense"
                    className="cursor-pointer w-full text-left"
                  >
                    Mark as Expense
                  </button>
                </Form>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Form method="post" className="w-full">
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  name="intent"
                  value="duplicate"
                  className="cursor-pointer w-full text-left"
                >
                  Mark as Duplicate
                </button>
              </Form>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Form method="post" className="w-full">
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  name="intent"
                  value="ignore"
                  className="cursor-pointer w-full text-left"
                >
                  Ignore this transaction
                </button>
              </Form>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Form method="post" className="w-full">
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  name="intent"
                  value="junk"
                  className="cursor-pointer w-full text-left"
                >
                  Mark as Junk
                </button>
              </Form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </TableRow>
  );
};

export default function Transactions({ loaderData }) {
  const { transactions, categories } = loaderData;
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-auto scrollbar-hide">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-32">Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead className="text-center"></TableHead>
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
