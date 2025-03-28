import { jwtDecode } from "jwt-decode";
import prisma from "~/utils/prismaClient";

export const action = async ({ request }) => {
  try {
    const { access_token, refresh_token, id_token, expires_in } =
      await request.json();
    const profileData = jwtDecode(id_token);
    let user;
    console.log("Creating/updating user", profileData.email);
    user = await prisma.user.upsert({
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

    return new Response(JSON.stringify(user), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);

    return new Response(
      JSON.stringify({
        error: "Authentication failed",
        requestId: crypto.randomUUID(), // For error tracking
      }),
      {
        status: error.response?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
