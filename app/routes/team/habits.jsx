import prisma from "~/utils/prismaClient";

import { useLoaderData } from "react-router";

export async function loader({ params }) {
  try {
    const teamId = Number(params.teamId);
    if (isNaN(teamId)) {
      throw new Response("Invalid Team ID", { status: 400 });
    }

    const habits = await prisma.habit.findMany({
      where: {
        user: {
          teamId: teamId,
        },
      },
      include: {
        user: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
                picture: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { habits };
  } catch (error) {
    console.error("Error loading habits:", error);
    throw new Response("Could not load habits for this team.", { status: 404 });
  }
}

function HabitCard({ habit }) {
  const color = habit.color || "#A0AEC0";
  const userName = habit.user?.user?.name || "A team member";
  const userPicture = habit.user?.user?.picture;

  return (
    <div className="bg-gray-50 rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-gray-800">{habit.name}</h3>
          <span
            className="px-3 py-1 text-xs font-semibold text-white uppercase rounded-full"
            style={{ backgroundColor: color }}
          >
            Every {habit.frequencyInterval} {habit.frequency.toLowerCase()}
          </span>
        </div>
        {habit.description && (
          <p className="text-gray-600 mt-2 text-sm">{habit.description}</p>
        )}
        <div className="mt-4 text-sm text-gray-500">
          <p>
            Goal:{" "}
            <span className="font-semibold text-gray-700">{habit.goal}</span>
          </p>
        </div>
      </div>
      <div className="bg-gray-100 px-5 py-3 border-t border-gray-100 flex items-center">
        {userPicture ? (
          <img
            src={userPicture}
            alt={userName}
            className="w-8 h-8 rounded-full mr-3"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 mr-3"></div>
        )}
        <span className="text-sm font-medium text-gray-700">{userName}</span>
      </div>
    </div>
  );
}

export default function HabitsPage() {
  const { habits } = useLoaderData();

  return (
    <div className="">
      <div className="container mx-auto px-4 py-8">
        {habits && habits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800">
              No Habits Yet
            </h2>
            <p className="text-gray-500 mt-2">
              It looks like this team hasn't added any habits. Be the first to
              add one!
            </p>
            {/* You could add a link/button to create a new habit here */}
            {/* <button className="mt-6 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
              Create New Habit
            </button> */}
          </div>
        )}
      </div>
    </div>
  );
}
