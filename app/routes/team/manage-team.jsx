import { Form } from "react-router";
import prisma from "~/utils/prismaClient";

export async function loader({ params }) {
  const teamUsers = await prisma.teamUser.findMany({
    where: {
      teamId: {
        equals: Number(params.teamId),
      },
    },
    select: {
      id: true,
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return teamUsers;
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const teamId = Number(params.teamId);

  if (intent === "add") {
    const email = formData.get("user-email");
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return `User with email ${email} not found`;
    }

    if (!user) {
      return json(
        { success: false, error: `No user found with email: ${email}` },
        { status: 404 }
      );
    }
    try {
      await prisma.teamUser.create({
        data: {
          teamId,
          userId: user.id,
        },
      });
    } catch (err) {
      if (err.code === "P2002") {
        console.warn("User already in team.");
      } else {
        throw err;
      }
    }
    return true;
  }

  if (intent === "remove") {
    const teamUserId = Number(formData.get("id"));
    await prisma.teamUser.delete({
      where: {
        id: teamUserId,
      },
    });
    return true;
  }

  return null;
}

export default function ManageTeam({ loaderData }) {
  return (
    <div className="mt-6">
      <h3>Team Name</h3>
      <ul className="w-[500px] mt-4">
        {loaderData.map((teamUser, i) => (
          <li
            key={teamUser.id}
            className="flex justify-between items-center border-b py-2"
          >
            <span>{teamUser.user.email}</span>

            <Form method="post">
              <input type="hidden" name="id" value={teamUser.id} />
              <button
                type="submit"
                name="intent"
                value="remove"
                className="bg-red-500 text-white px-2 py-0.5 rounded-md"
              >
                Remove
              </button>
            </Form>
          </li>
        ))}
        <Form method="post" id="add-user">
          <li className="flex justify-between items-center border-b py-2">
            <input
              type="text"
              formId="add-user"
              name="user-email"
              required
              placeholder="user email"
              className="border p-2 h-8 rounded-md"
            />
            <button
              type="submit"
              name="intent"
              value="add"
              className="bg-blue-500 text-white px-2 py-0.5 rounded-md"
            >
              Add
            </button>
          </li>
        </Form>
      </ul>
    </div>
  );
}
