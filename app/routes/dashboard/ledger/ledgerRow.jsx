import { Form, Link, useFetcher } from "react-router";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableCells } from "~/components/ui/tableCells";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { classNames, formatDate, getInitials } from "~/utils/helperFunctions";
import {
  IconCirclePlusFilled,
  IconDotsVertical,
  IconX,
} from "~/components/ui/icons";
import { useState } from "react";
import { AddTags } from "./addTags";

export function LedgerTable({
  filteredTransactions,
  categories,
  transactions,
  tags,
}) {
  const fetcher = useFetcher();
  function LedgerDropDown({ item }) {
    return (
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
              <DropdownMenuItem>Email: {item.user.user.email}</DropdownMenuItem>
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
    );
  }

  function LedgerRow({ item, i }) {
    let selectedTags = item.tags.map((tag) => tag.tag);
    const handleTagUpdate = ({ inputTags }) => {
      const formData = new FormData();
      formData.append("intent", "updateTags");
      formData.append("id", item.id);
      selectedTags = inputTags;
      inputTags.forEach((tag) => {
        if (tag.id === "new") {
          if (tag.tag?.trim()) {
            formData.append("newTags", tag.tag.trim());
          }
        } else if (tag.id) {
          formData.append("tagIds", tag.id.toString());
        }
      });
      fetcher.submit(formData, {
        method: "post",
        replace: true,
      });
    };
    const formId = `edit-form-${item.id}`;
    return (
      <TableRow
        key={item.id}
        id={item.id}
        className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
      >
        <TableCells.Check className="w-4 text-xs" />
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
              ? "text-red-500"
              : "text-green-700",
            "w-32"
          )}
          name="amountExtract"
          defaultValue={item.amountExtract}
        />
        <TableCells.Input
          formId={formId}
          name="payeeExtract"
          defaultValue={item.payeeExtract}
          className="w-[500px]"
        />
        <TableCell className="w-8">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex">
            <div className="m-auto">{getInitials(item.user.user.name)}</div>
          </div>
        </TableCell>
        <TableCell className="w-56">
          <div className="flex gap-x-1 gap-y-1 flex-wrap my-3 items-center">
            {selectedTags.map((tag) => (
              <div
                className="bg-gray-300 px-2 h-4 rounded-full text-xs flex items-center"
                key={tag.id}
              >
                <span>{tag.tag}</span>
              </div>
            ))}
            <AddTags
              ledgerId={item.id}
              tags={tags}
              selectedTags={selectedTags}
              handleTagUpdate={handleTagUpdate}
            />
          </div>
        </TableCell>
        <TableCell className="w-32">
          <div className="flex items-center space-x-6">
            <Form method="post" id={formId}>
              <input type="hidden" name="id" value={item.id} />
              <button
                name="intent"
                value="edit"
                type="submit"
                className="bg-gray-400 text-primary-foreground hover:bg-primary/70 hover:text-primary-foreground min-w-8 px-4 rounded-md cursor-pointer"
              >
                <span>Save</span>
              </button>
            </Form>
            <LedgerDropDown item={item} />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden w-fit">
      <div className="overflow-auto scrollbar-hide">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="w-32">Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead className="text-center">User</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((item, i) => (
              <LedgerRow item={item} i={i} key={item.id} />
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
  );
}
