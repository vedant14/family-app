import { jwtDecode } from "jwt-decode";
import prisma from "~/utils/prismaClient";

export const action = async ({ request }) => {
  try {
    const { access_token, refresh_token, id_token, expires_in } =
      await request.json();
    const profileData = jwtDecode(id_token);

    console.log("Creating/updating user", profileData.email);

    // Upsert user
    let user = await prisma.user.upsert({
      where: { email: profileData.email },
      update: {
        name: profileData.name,
        accessToken: access_token,
        picture: profileData.picture,
        refreshToken: refresh_token,
        idToken: id_token,
        tokenExpiry: new Date(Date.now() + expires_in * 1000),
      },
      create: {
        name: profileData.name,
        email: profileData.email,
        picture: profileData.picture,
        accessToken: access_token,
        idToken: id_token,
        refreshToken: refresh_token,
        tokenExpiry: new Date(Date.now() + expires_in * 1000),
      },
    });
    // Check if the user is part of any team
    let existingTeamUser = await prisma.teamUser.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingTeamUser || existingTeamUser.length === 0) {
      console.log(`Creating a new team for ${user.email}`);
      const newTeam = await prisma.team.create({
        data: {
          name: `${profileData.name}'s Team`,
        },
      });

      // Link user to the new team in TeamUser
      existingTeamUser = await prisma.teamUser.create({
        data: {
          teamId: newTeam.id,
          userId: user.id,
        },
        select: {
          id: true,
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }
    const transformedTeam = existingTeamUser.map((item) => ({
      teamUserId: item.id,
      teamId: item.team.id,
      name: item.team.name,
    }));
    return new Response(
      JSON.stringify({ user: user, teams: transformedTeam }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching user profile:", error);

    return new Response(
      JSON.stringify({
        error: "Authentication failed",
        requestId: crypto.randomUUID(),
      }),
      {
        status: error.response?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
