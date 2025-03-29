import { useLoaderData, Form } from "react-router";
import prisma from "~/utils/prismaClient";
import { useAuthStore } from "~/utils/store";

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
    await prisma.category.update({ where: { id }, data: { categoryName } });
  }

  return null;
}

export default function Categories() {
  const categories = useLoaderData();
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Categories</h1>

      {/* Add Category Form */}
      <Form method="post" className="mb-4 flex gap-2">
        <input
          type="text"
          name="categoryName"
          required
          placeholder="New Category"
          className="border p-2"
        />
        <input name="teamId" type="hidden" value={selectedTeam.teamId} />

        <button
          type="submit"
          name="intent"
          value="add"
          className="bg-blue-500 text-white px-4 py-2"
        >
          Add
        </button>
      </Form>

      {/* List of Categories */}
      <ul>
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex justify-between items-center border-b py-2"
          >
            <span>{category.categoryName}</span>
            <div className="flex gap-2">
              {/* Edit Form */}
              <Form method="post" className="flex gap-2">
                <input type="hidden" name="id" value={category.id} />
                <input
                  type="text"
                  name="categoryName"
                  defaultValue={category.categoryName}
                  className="border p-1"
                />
                <button
                  type="submit"
                  name="intent"
                  value="edit"
                  className="bg-yellow-500 text-white px-2 py-1"
                >
                  Edit
                </button>
              </Form>

              {/* Delete Button */}
              <Form method="post">
                <input type="hidden" name="id" value={category.id} />
                <button
                  type="submit"
                  name="intent"
                  value="delete"
                  className="bg-red-500 text-white px-2 py-1"
                >
                  Delete
                </button>
              </Form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
