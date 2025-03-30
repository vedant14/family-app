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
import { findTeamUserByEmail, verifyIdToken } from "~/utils/authHelpers";
import { parseCookies } from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";
import { useDialogStore } from "~/utils/store";

export async function action({ request, params }) {
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
    categoryId,
    defaultType,
    rulePriority = 1,
  } = data;
  const verifyUser = await verifyIdToken(cookie.user);
  const user = await findTeamUserByEmail(
    verifyUser.email,
    Number(params.teamId)
  );
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
      defaultType,
      rulePriority,
      categoryId: Number(categoryId),
    },
  });
  return source;
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

export default function Product({ loaderData, actionData }) {
  const open = useDialogStore((state) => state.open);
  const toggleOpen = useDialogStore((state) => state.toggleOpen);
  useEffect(() => {
    if (actionData) {
      if (actionData.error) {
        console.log(actionData.error);
      } else {
        toggleOpen();
      }
    }
  }, [actionData]);
  const { sources, categories } = loaderData;
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open}>
          <SourceForm categories={categories} />
          <Button
            tooltip="Quick Create"
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            onClick={toggleOpen}
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
              <TableHead>ID</TableHead>
              <TableHead>Source Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-left">User</TableHead>
              <TableHead className="text-left">Query</TableHead>
              <TableHead className="text-left">Amount Regex</TableHead>
              <TableHead className="text-left">Amount Regex Backup</TableHead>
              <TableHead className="text-left">Payee Regex</TableHead>
              <TableHead className="text-left">Payee Regex Backup</TableHead>
              <TableHead className="text-left">Default Category</TableHead>
              <TableHead className="text-center">...</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source, i) => (
              <TableRow
                key={i}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <TableCell>{source.id}</TableCell>
                <TableCell>{source.sourceName}</TableCell>
                <TableCell>{source.sourceType}</TableCell>
                <TableCell>{source.user.user.email}</TableCell>
                <TableCell>{source.query}</TableCell>
                <TableCell>{source.payeeRegex}</TableCell>
                <TableCell>{source.payeeRegexBackup}</TableCell>
                <TableCell>{source.amountRegex}</TableCell>
                <TableCell>{source.amountRegexBackup}</TableCell>
                <TableCell>{source.defaultCategory?.categoryName}</TableCell>
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
