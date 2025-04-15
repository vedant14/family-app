import { useLoaderData, Form } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { IconDotsVertical } from "~/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableCells } from "~/components/ui/tableCells";
import prisma from "~/utils/prismaClient";
import { useAuthStore } from "~/utils/store";
import colors from "~/data/colors.json";
import { useState } from "react";

export async function loader({ params }) {
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
  return categories;
}

export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "add") {
    const categoryName = formData.get("categoryName");
    const teamId = Number(formData.get("teamId"));
    await prisma.category.create({ data: { categoryName, teamId } });
  }

  if (intent === "delete") {
    const id = Number(formData.get("id"));
    await prisma.category.delete({ where: { id } });
  }

  if (intent === "edit") {
    const id = Number(formData.get("id"));
    const categoryName = formData.get("categoryName");
    const colorCode = formData.get("colorCode");
    await prisma.category.update({
      where: { id },
      data: { categoryName, colorCode },
    });
  }

  return null;
}

export default function Categories({ loaderData }) {
  const categories = loaderData;
  if (!categories) {
    return null;
  }
  const selectedTeam = useAuthStore((state) => state.selectedTeam);

  return (
    <div className="rounded-md border w-fit">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Category Name</TableHead>
            <TableHead className="text-center">Color Code</TableHead>
            <TableHead>Mark as Investments</TableHead>
            <TableHead>Don't track?</TableHead>
            <TableHead></TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category, i) => {
            const formId = `edit-form-${category.id}`;
            const [selectedColor, setSelectedColor] = useState(null);
            return (
              <TableRow key={category.id} className="h-12">
                <TableCells.Input
                  formId={formId}
                  type="text"
                  name="categoryName"
                  defaultValue={category.categoryName}
                  className="!h-12 w-32"
                />
                <TableCell className="w-32 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <div
                        className="w-8 h-8 rounded-md border-transparent focus:border-transparent focus:ring-0 cursor-pointer"
                        style={{
                          backgroundColor: selectedColor
                            ? selectedColor
                            : category.colorCode || "#808080",
                        }}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <div className="grid grid-cols-3 gap-2">
                        {colors.map((color) => (
                          <div
                            key={color}
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => setSelectedColor(color)}
                          >
                            <div
                              className="w-8 h-8 rounded-md"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="w-32">Inve</TableCell>
                <TableCell className="w-32">Don't track</TableCell>
                <TableCell className="text-right w-32">
                  <Form method="post" id={formId} className="">
                    <input type="hidden" name="id" value={category.id} />
                    <input
                      type="hidden"
                      name="colorCode"
                      value={selectedColor ? selectedColor : ""}
                    />
                    <button
                      type="submit"
                      name="intent"
                      value="edit"
                      className="cursor-pointer w-full text-left"
                    >
                      Update
                    </button>
                  </Form>
                </TableCell>
                <TableCell className="w-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <IconDotsVertical className="text-gray-300" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem className="cursor-default">
                        Category ID: {category.id}
                      </DropdownMenuItem>
                      <DropdownMenuItem></DropdownMenuItem>
                      <DropdownMenuItem>
                        <Form method="post">
                          <input type="hidden" name="id" value={category.id} />
                          <button
                            type="submit"
                            name="intent"
                            value="delete"
                            className="cursor-pointer w-full text-left"
                          >
                            Delete
                          </button>
                        </Form>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
