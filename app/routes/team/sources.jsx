import { IconCirclePlusFilled, IconDotsVertical } from "~/components/ui/icons";
import { useEffect, useState, useRef } from "react";
import { Form } from "react-router";
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
import { TableCells } from "~/components/ui/tableCells";
import { findTeamUserByEmail, verifyIdToken } from "~/utils/authHelpers";
import { parseCookies } from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";
import { useDialogStore } from "~/utils/store";
import { SourceForm } from "~/dashboard/create-source-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const COLUMN_WIDTHS = {
  sourceName: "w-[200px]",
  query: "w-[300px]",
  regex: "w-[250px]",
  sourceType: "min-w-[150px]",
  defaultType: "min-w-[150px]",
  category: "min-w-[200px]",
};

export async function action({ request, params }) {
  const formData = Object.fromEntries(await request.formData());
  const { intent, id, ...data } = formData;

  const header = Object.fromEntries(request.headers);
  const cookie = parseCookies(header.cookie);
  const verifyUser = await verifyIdToken(cookie.user);
  const user = await findTeamUserByEmail(
    verifyUser.email,
    Number(params.teamId)
  );

  if (!user) return { error: "User not found" };

  switch (intent) {
    case "add":
    case "add-form": {
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
        categoryId,
        defaultType,
        rulePriority = 1,
      } = data;

      if (!sourceName || !sourceType)
        return { error: "What is required, is required!" };

      const queryParts = [];
      if (subject) queryParts.push(`subject:${subject}`);
      if (label) queryParts.push(`label:${label}`);
      if (fromEmail) queryParts.push(`from:${fromEmail}`);
      const query = queryParts.join(" ");

      await prisma.source.create({
        data: {
          sourceName,
          query,
          sourceType,
          userId: user.id,
          amountRegex,
          amountRegexBackup,
          payeeRegex,
          payeeRegexBackup,
          defaultType,
          rulePriority,
          categoryId: Number(categoryId),
        },
      });
      return true;
    }
    case "activate":
    case "deactivate": {
      const status = intent === "activate" ? "ACTIVE" : "INACTIVE";
      await prisma.source.update({
        where: { id: Number(id) },
        data: { status },
      });
      return true;
    }
    case "edit": {
      const {
        sourceName,
        sourceType,
        query,
        amountRegex,
        amountRegexBackup,
        payeeRegex,
        payeeRegexBackup,
        categoryId,
        defaultType,
      } = data;
      await prisma.source.update({
        where: { id: Number(id) },
        data: {
          sourceName,
          query,
          sourceType,
          amountRegex,
          amountRegexBackup,
          payeeRegex,
          payeeRegexBackup,
          defaultType,
          categoryId: Number(categoryId),
        },
      });
      return true;
    }

    default:
      return { error: "Invalid intent" };
  }
}

export async function loader({ params }) {
  const sources = await prisma.source.findMany({
    select: {
      id: true,
      sourceName: true,
      sourceType: true,
      query: true,
      payeeRegex: true,
      payeeRegexBackup: true,
      defaultCategory: true,
      amountRegex: true,
      status: true,
      defaultType: true,
      amountRegexBackup: true,
      user: {
        select: {
          user: {
            select: {
              email: true,
            },
          },
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
      createdAt: "asc",
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
  return {
    sources,
    categories,
  };
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}

function SourceRow({ source, categories, i }) {
  const formId = `edit-form-${source.id}`;
  return (
    <TableRow className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
      <TableCells.Text>{source.id}</TableCells.Text>
      <TableCells.Input
        formId={formId}
        name="sourceName"
        className={COLUMN_WIDTHS.sourceName}
        defaultValue={source.sourceName}
      />
      <TableCells.Select
        formId={formId}
        name="sourceType"
        defaultValue={source.sourceType}
        className={COLUMN_WIDTHS.sourceType}
      >
        <option value="MAIL">MAIL</option>
        <option value="API">API</option>
      </TableCells.Select>
      <TableCells.Text>{source.user.user.email}</TableCells.Text>
      <TableCells.Input
        formId={formId}
        name="query"
        className={COLUMN_WIDTHS.query}
        defaultValue={source.query}
      />
      <TableCells.Input
        formId={formId}
        name="amountRegex"
        className={COLUMN_WIDTHS.regex}
        defaultValue={source.amountRegex}
      />
      <TableCells.Input
        formId={formId}
        name="amountRegexBackup"
        className={COLUMN_WIDTHS.regex}
        defaultValue={source.amountRegexBackup}
      />
      <TableCells.Input
        formId={formId}
        name="payeeRegex"
        className={COLUMN_WIDTHS.regex}
        defaultValue={source.payeeRegex}
      />
      <TableCells.Input
        formId={formId}
        name="payeeRegexBackup"
        className={COLUMN_WIDTHS.regex}
        defaultValue={source.payeeRegexBackup}
      />
      <TableCell>
        <select
          name="defaultType"
          form={formId}
          className="h-full min-h-[38px] px-4 w-full border-0 focus:outline-none"
          defaultValue={source.defaultType || ""}
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
          className="h-full min-h-[38px] px-4 w-full border-0 focus:outline-none"
          defaultValue={source.defaultCategory?.id || ""}
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
      <TableCells.Text>{source.status}</TableCells.Text>
      <TableCell className="px-6 whitespace-nowrap text-right text-sm font-medium flex gap-x-2">
        <Form method="post" id={formId} className="py-2">
          <input type="hidden" name="id" value={source.id} />
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
            {source.status === "ACTIVE" ? (
              <DropdownMenuItem>
                <Form method="post" className="w-full">
                  <input type="hidden" name="id" value={source.id} />
                  <button
                    type="submit"
                    name="intent"
                    value="deactivate"
                    className="cursor-pointer w-full text-left"
                  >
                    De-Activate
                  </button>
                </Form>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
                <Form method="post" className="w-full">
                  <input type="hidden" name="id" value={source.id} />
                  <button
                    type="submit"
                    name="intent"
                    value="activate"
                    className="cursor-pointer w-full text-left"
                  >
                    Activate
                  </button>
                </Form>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function NewSourceRow({ categories, actionData }) {
  const formId = "add-form";
  const formRef = useRef(null);

  useEffect(() => {
    if (actionData === true) {
      formRef.current?.reset();
    }
  }, [actionData]);

  return (
    <TableRow>
      <TableCells.Text>New Row</TableCells.Text>
      <TableCells.Input
        formId={formId}
        name="sourceName"
        className={COLUMN_WIDTHS.sourceName}
        required
      />
      <TableCells.Select
        formId={formId}
        name="sourceType"
        value=""
        className={COLUMN_WIDTHS.sourceType}
      >
        <option value="" disabled>
          Select type
        </option>
        <option value="MAIL">MAIL</option>
        <option value="API">API</option>
      </TableCells.Select>
      <TableCells.Text>-</TableCells.Text>
      <TableCells.Input
        formId={formId}
        name="query"
        className={COLUMN_WIDTHS.query}
      />
      <TableCells.Input
        formId={formId}
        name="amountRegex"
        className={COLUMN_WIDTHS.regex}
      />
      <TableCells.Input
        formId={formId}
        name="amountRegexBackup"
        className={COLUMN_WIDTHS.regex}
      />
      <TableCells.Input
        formId={formId}
        name="payeeRegex"
        className={COLUMN_WIDTHS.regex}
      />
      <TableCells.Input
        formId={formId}
        name="payeeRegexBackup"
        className={COLUMN_WIDTHS.regex}
      />
      <TableCell className="p-0">
        <select
          name="defaultType"
          form={formId}
          className="h-full min-h-[38px] px-4 w-full border-0 focus:outline-none"
          defaultValue=""
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
          className="h-full min-h-[38px] px-4 w-full border-0 focus:outline-none"
          defaultValue=""
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
      <TableCells.Text>-</TableCells.Text>
      <TableCell className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium flex gap-x-2">
        <Form method="post" id={formId} ref={formRef}>
          <button
            name="intent"
            value="add-form"
            type="submit"
            size="sm"
            className="bg-gray-400 text-primary-foreground hover:bg-primary/70 hover:text-primary-foreground min-w-8 px-4 rounded-md cursor-pointer"
          >
            <span>Add</span>
          </button>
        </Form>
      </TableCell>
    </TableRow>
  );
}

export default function Sources({ loaderData, actionData }) {
  const [addFormOpen, setAddFormOpen] = useState(false);
  const toggleOpen = (form) => form === "add" && setAddFormOpen(!addFormOpen);
  const { sources, categories } = loaderData;

  // useEffect(() => {
  //   if (actionData === true) {
  //     toast.success("Changes saved successfully!");
  //   } else if (actionData?.error) {
  //     toast.error(actionData.error);
  //   }
  // }, [actionData]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={addFormOpen}>
          <SourceForm
            categories={categories}
            toggleOpen={() => toggleOpen("add")}
          />
          <Button
            tooltip="Quick Create"
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            onClick={() => toggleOpen("add")}
          >
            <IconCirclePlusFilled />
            <span>Add Source</span>
          </Button>
        </Dialog>
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className={COLUMN_WIDTHS.sourceName}>
                Source Title *
              </TableHead>
              <TableHead className={COLUMN_WIDTHS.sourceType}>Type *</TableHead>
              <TableHead className="w-[150px]">User</TableHead>
              <TableHead className={COLUMN_WIDTHS.query}>Query</TableHead>
              <TableHead className={COLUMN_WIDTHS.regex}>
                Amount Regex
              </TableHead>
              <TableHead className={COLUMN_WIDTHS.regex}>
                Amount Regex Backup
              </TableHead>
              <TableHead className={COLUMN_WIDTHS.regex}>Payee Regex</TableHead>
              <TableHead className={COLUMN_WIDTHS.regex}>
                Payee Regex Backup
              </TableHead>
              <TableHead className={COLUMN_WIDTHS.defaultType}>
                Default Type
              </TableHead>
              <TableHead className={COLUMN_WIDTHS.category}>
                Default Category
              </TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[150px] text-center">...</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source, i) => (
              <SourceRow
                key={source.id}
                source={source}
                categories={categories}
                i={i}
              />
            ))}
            <NewSourceRow categories={categories} actionData={actionData} />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
