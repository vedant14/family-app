import prisma from "~/utils/prismaClient";

export const action = async ({ request }) => {
  try {
    const {
      name,
      description,
      color,
      frequency,
      goal,
      frequencyInterval,
      userId,
    } = await request.json();

    if (!name || typeof name !== "string") {
      return new Response(
        JSON.stringify({ error: "Habit name is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Team User is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Create the new habit in the database and associate it with the user.
    const newHabit = await prisma.habit.create({
      data: {
        name: name,
        description: description,
        color: color,
        frequencyInterval: parseInt(frequencyInterval, 10),
        frequency:
          frequency && ["DAILY", "WEEKLY", "MONTHLY"].includes(frequency)
            ? frequency
            : "DAILY",
        goal: goal,
        user: {
          connect: {
            id: parseInt(userId, 10),
          },
        },
      },
    });

    return new Response(JSON.stringify({ habit: newHabit }), {
      status: 201, // 201 Created is more appropriate for a new resource.
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Handle errors.
    console.error("Error creating habit:", error);
    // This could be a database error or an error from your auth utility.
    return new Response(JSON.stringify({ error: "Failed to create habit." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
