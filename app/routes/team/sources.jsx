import { IconCirclePlusFilled } from "~/components/ui/icons";
import { useEffect, useState, useRef } from "react";
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
import { findTeamUserByEmail, verifyIdToken } from "~/utils/authHelpers";
import { parseCookies } from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";
import { useDialogStore } from "~/utils/store";
import { SourceForm } from "~/dashboard/create-source-form";

const COLUMN_WIDTHS = {
  sourceName: "w-[200px]",
  query: "w-[300px]",
  regex: "w-[250px]",
  sourceType: "min-w-[150px]",
  defaultType: "min-w-[150px]",
  category: "min-w-[200px]",
};

export async function action({ request, params }) {
  let formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "add") {
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
      categoryId,
      defaultType,
      rulePriority = 1,
    } = data;
    const header = Object.fromEntries(request.headers);
    const cookie = parseCookies(header.cookie);
    const verifyUser = await verifyIdToken(cookie.user);
    const user = await findTeamUserByEmail(
      verifyUser.email,
      Number(params.teamId)
    );
    if (!sourceName || !sourceType) {
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
        defaultType,
        rulePriority,
        categoryId: Number(categoryId),
      },
    });
    return true;
  } else if (intent === "activate") {
    const sourceId = Number(formData.get("id"));
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: "ACTIVE" },
    });
    return true;
  } else if (intent === "edit") {
    const sourceId = Number(formData.get("id"));
    let data = Object.fromEntries(formData);
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
    const source = await prisma.source.update({
      where: { id: sourceId },
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
  } else if (intent === "add-form") {
    let data = Object.fromEntries(formData);
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
      rulePriority = 1,
    } = data;
    const header = Object.fromEntries(request.headers);
    const cookie = parseCookies(header.cookie);
    const verifyUser = await verifyIdToken(cookie.user);
    const user = await findTeamUserByEmail(
      verifyUser.email,
      Number(params.teamId)
    );
    if (!sourceName || !sourceType) {
      return { error: "What is required, is required!" };
    }
    if (!user) {
      return { error: "User not found" };
    }
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
        defaultType,
        rulePriority,
        categoryId: Number(categoryId),
      },
    });
    return true;
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

const TableCells = {
  Input: ({
    formId,
    name,
    value,
    type = "text",
    className = "",
    readOnly = false,
    onChange = null,
  }) => (
    <TableCell className="p-0">
      <input
        type={type}
        name={name}
        defaultValue={value}
        form={formId}
        readOnly={readOnly}
        onChange={onChange}
        className={`h-full min-h-[38px] px-4 py-2 border-0 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded-md focus:ring-inset ${
          readOnly ? "bg-gray-100" : "bg-transparent"
        } ${className}`}
      />
    </TableCell>
  ),
  Text: ({ children, className = "" }) => (
    <TableCell className={`px-4 py-2 ${className}`}>{children}</TableCell>
  ),
  Select: ({ formId, name, value, className = "", children }) => (
    <TableCell className={`p-0 ${className}`}>
      <select
        name={name}
        form={formId}
        defaultValue={value}
        className={`h-full min-h-[38px] px-4 py-2 w-full border-0 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded-md focus:ring-inset ${className}`}
      >
        {children}
      </select>
    </TableCell>
  ),
};

function SourceRow({ source, categories }) {
  const formId = `edit-form-${source.id}`;
  return (
    <TableRow>
      <TableCells.Text>{source.id}</TableCells.Text>
      <TableCells.Input
        formId={formId}
        name="sourceName"
        className={COLUMN_WIDTHS.sourceName}
        value={source.sourceName}
      />
      <TableCells.Select
        formId={formId}
        name="sourceType"
        value={source.sourceType}
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
        value={source.query}
      />
      <TableCells.Input
        formId={formId}
        name="amountRegex"
        className={COLUMN_WIDTHS.regex}
        value={source.amountRegex}
      />
      <TableCells.Input
        formId={formId}
        name="amountRegexBackup"
        className={COLUMN_WIDTHS.regex}
        value={source.amountRegexBackup}
      />
      <TableCells.Input
        formId={formId}
        name="payeeRegex"
        className={COLUMN_WIDTHS.regex}
        value={source.payeeRegex}
      />
      <TableCells.Input
        formId={formId}
        name="payeeRegexBackup"
        className={COLUMN_WIDTHS.regex}
        value={source.payeeRegexBackup}
      />
      <TableCell className="p-0">
        <select
          name="defaultType"
          form={formId}
          className="h-full min-h-[38px] px-4 py-2 w-full border-0 focus:outline-none"
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
          className="h-full min-h-[38px] px-4 py-2 w-full border-0 focus:outline-none"
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
      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-x-2">
        <Form method="post" id={formId}>
          <input type="hidden" name="id" value={source.id} />
          <Button
            name="intent"
            value="edit"
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground min-w-8"
          >
            <span>Save</span>
          </Button>
        </Form>
        <Form method="post">
          <input type="hidden" name="id" value={source.id} />
          <Button
            type="submit"
            name="intent"
            value="activate"
            className="bg-green-700 text-primary-foreground"
          >
            Activate
          </Button>
        </Form>
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
      toast.success("Source added successfully!");
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
          className="h-full min-h-[38px] px-4 py-2 w-full border-0 focus:outline-none"
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
          className="h-full min-h-[38px] px-4 py-2 w-full border-0 focus:outline-none"
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
      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-x-2">
        <Form method="post" id={formId} ref={formRef}>
          <Button
            name="intent"
            value="add-form"
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground min-w-8"
          >
            <span>Add</span>
          </Button>
        </Form>
      </TableCell>
    </TableRow>
  );
}

export default function Product({ loaderData, actionData }) {
  const [addFormOpen, setAddFormOpen] = useState(false);
  const toggleOpen = (form) => form === "add" && setAddFormOpen(!addFormOpen);
  const { sources, categories } = loaderData;

  useEffect(() => {
    if (actionData === true) {
      toast.success("Changes saved successfully!");
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

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
            {sources.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                categories={categories}
              />
            ))}
            <NewSourceRow categories={categories} actionData={actionData} />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
