import { useLoaderData, Form } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export async function action({ params, request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  console.log(params);
  if (!params.teamId) {
    return null;
  }
  if (intent === "add") {
    const categoryName = formData.get("categoryName");
    const colorCode = formData.get("colorCode");
    const teamId = Number(params.teamId);
    await prisma.category.create({ data: { categoryName, teamId, colorCode } });
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
  const [newSelectColor, setNewSelectColor] = useState("#808080");

  function CategoryRow({ category }) {
    const [selectedColor, setSelectedColor] = useState(null);
    const formId = `edit-form-${category.id}`;
    const displayColor = selectedColor ?? category.colorCode ?? "#808080";
    console.log("VEDANT", category);
    return (
      <TableRow key={category.id} className="h-12">
        <TableCells.Input
          formId={formId}
          type="text"
          name="categoryName"
          defaultValue={category.categoryName}
          className="!h-12 w-64"
        />
        <TableCell className="w-32 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Change color"
                className="w-8 h-8 rounded-md border cursor-pointer"
                style={{ backgroundColor: displayColor }}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="grid grid-cols-3 gap-2 p-2">
                {colors.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className="flex items-center justify-center p-0 border-none bg-transparent cursor-pointer group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Set color to ${color}`}
                  >
                    <div
                      className="w-8 h-8 rounded-md border group-hover:ring-2 group-hover:ring-ring group-hover:ring-offset-1"
                      style={{ backgroundColor: color }}
                    />
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
        <TableCell className="w-32">Inve</TableCell>
        <TableCell className="w-32">Don't track</TableCell>
        <TableCell className="text-center w-32">
          <Form method="post" id={formId}>
            <input type="hidden" name="id" value={category.id} />
            <input
              type="hidden"
              name="colorCode"
              value={selectedColor ? selectedColor : category.colorCode}
            />
            <button
              type="submit"
              name="intent"
              value="edit"
              className="cursor-pointer w-full px-1.5 py-0.5 bg-gray-100 rounded-md text-gray-500 hover:bg-gray-400 hover:text-gray-700"
            >
              Update
            </button>
          </Form>
        </TableCell>
        <TableCell className="w-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Category options">
                <IconDotsVertical className="text-gray-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="cursor-default">
                Category ID: {category.id}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Form method="post" style={{ display: "contents" }}>
                  <input type="hidden" name="id" value={category.id} />
                  <button
                    type="submit"
                    name="intent"
                    value="delete"
                    className="cursor-pointer w-full text-left text-red-600" // Style delete
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
  }
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
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
          <TableRow className="h-12">
            <TableCells.Input
              type="text"
              formId="add-form"
              name="categoryName"
              placeholder="New Category"
              className="!h-12 w-32"
            />
            <TableCell className="w-32 text-center">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div
                    className="w-8 h-8 rounded-md border-transparent focus:border-transparent focus:ring-0 cursor-pointer"
                    style={{
                      backgroundColor: newSelectColor,
                    }}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((color) => (
                      <div
                        key={color}
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setNewSelectColor(color)}
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
            <TableCell className="text-center w-32">
              <Form method="post" id="add-form" className="">
                <input type="hidden" name="colorCode" value={newSelectColor} />
                <button
                  type="submit"
                  name="intent"
                  value="add"
                  className="cursor-pointer w-full px-1.5 py-0.5 bg-gray-100 rounded-md w-fit text-gray-500 hover:bg-gray-400 hover:text-gray-700"
                >
                  Create category
                </button>
              </Form>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
