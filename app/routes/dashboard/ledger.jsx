import { useState, useEffect, useMemo } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";

import { IconDotsVertical, IconX } from "~/components/ui/icons";
import { Form, Link, useLocation } from "react-router";
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
import { endOfMonthUTC, startOfMonthUTC } from "~/utils/dateHelpers";
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
  const nowUTC = new Date(); // This will be in the server's local timezone initially
  const nowForUTC = new Date(nowUTC.toISOString()); // Convert to a UTC Date object

  const thisMonthRange = {
    gte: startOfMonthUTC(nowForUTC),
    lte: endOfMonthUTC(nowForUTC),
  };

  const transactions = await prisma.ledger.findMany({
    select: {
      id: true,
      date: true,
      transactionTypeExtract: true,
      emailId: true,
      emailSubject: true,
      body: true,
      amountExtract: true,
      categoryId: true,
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
      date: thisMonthRange,
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
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [query, setQuery] = useState("");
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get("category");
    if (categoryParam) {
      const categoryIds = categoryParam.split(",").map(Number);
      const initialSelectedCategories = categories.filter((cat) => categoryIds.includes(cat.id));
      setSelectedCategories(initialSelectedCategories);
    }
  }, [location.search, categories]);
  const filteredAvailableCategories = useMemo(() => {

    const selectedCategoryIds = new Set(
      selectedCategories.map((cat) => cat.id)
    );
    const available = categories.filter(
      (category) => !selectedCategoryIds.has(category.id)
    );

    if (query === "") {
      return available;
    } else {
      return available.filter((category) =>
        category.categoryName.toLowerCase().includes(query.toLowerCase())
      );
    }
  }, [categories, query, selectedCategories]);

  const handleSelectCategory = (category) => {
    if (category && !selectedCategories.some((sc) => sc.id === category.id)) {
      setSelectedCategories([...selectedCategories, category]);
    }
    setQuery("");
  };

  const handleRemoveCategory = (categoryToRemove) => {
    setSelectedCategories(
      selectedCategories.filter(
        (category) => category.id !== categoryToRemove.id
      )
    );
  };

  useEffect(() => {
      if (selectedCategories.length === 0) {
        setFilteredTransactions(transactions);
      } else {
        const selectedIds = new Set(selectedCategories.map((cat) => cat.id));
        setFilteredTransactions(transactions.filter((transaction) => selectedIds.has(transaction.categoryId)));
      }
    }, [transactions, selectedCategories]);

  return (
    <div>
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 mb-2">
          {selectedCategories.map((category) => (
            <span
              key={category.id}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
            >
              {category.categoryName}
              <button
                type="button"
                onClick={() => handleRemoveCategory(category)}
                className="group relative -mr-1 h-3.5 w-3.5 rounded-sm"
                aria-label={`Remove ${category.categoryName}`}
              >
                <IconX
                  className="h-3.5 w-3.5 stroke-gray-400"
                  aria-hidden="true"
                />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-1 mb-4">
        <Combobox
          value={null}
          onChange={handleSelectCategory}
          onClose={() => setQuery("")}
        >
          <ComboboxInput
            className="border w-48 px-2 py-1 rounded-md"
            placeholder="Add category filter..."
            aria-label="Add category filter"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ComboboxOptions
            anchor="bottom start"
            className="empty:invisible bg-white w-48 divide-y-1 border mt-1 rounded-md max-h-60 overflow-y-auto"
          >
            {filteredAvailableCategories.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                Nothing found.
              </div>
            ) : (
              filteredAvailableCategories.map((category) => (
                <ComboboxOption
                  key={category.id}
                  value={category}
                  className="data-[focus]:bg-blue-100 px-2 py-1 cursor-pointer"
                >
                  {category.categoryName}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </Combobox>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-auto scrollbar-hide">
          <Table>
            <TableHeader className="bg-muted">
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
              {filteredTransactions.map((item, i) => (
                <LedgerRow
                  item={item}
                  i={i}
                  key={item.id}
                  categories={categories}
                />
              ))}
            </TableBody>
          </Table>
        </div>
        {transactions.length === 0 && transactions.length > 0 && (
          <div className="text-center py-4 text-gray-500">
            No transactions match the selected categories.
          </div>
        )}
      </div>
    </div>
  );
}
