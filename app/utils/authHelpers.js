import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import prisma from "~/utils/prismaClient";

export async function verifyIdToken(idToken) {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const client = new OAuth2Client(CLIENT_ID);

  try {
    const decoded = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64").toString()
    );
    if (Date.now() / 1000 > decoded.exp) {
      console.warn("ID Token expired. Prompt user to reauthenticate.");
      return {
        auth: false,
        email: decoded.email,
      };
    }
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });

    return {
      auth: true,
      email: decoded.email,
      user: ticket.getPayload(),
    };
  } catch (error) {
    console.error("Invalid ID Token:", error);
    return null;
  }
}

export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email: email,
    },
    select: {
      id: true,
      refreshToken: true,
      teams: {
        select: {
          teamId: true,
        },
      },
    },
  });
};
export const findTeamUserByEmail = async (email) => {
  return await prisma.teamUser.findUnique({
    where: {
      user: {
        email: email,
      },
    },
  });
};

export async function refreshToken(email) {
  if (!email) {
    return null;
  }
  const user = await findUserByEmail(email);
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect_uri = process.env.GOOGLE_REDIRECT_URI;
  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      refresh_token: user.refreshToken,
      client_id,
      client_secret,
      grant_type: "refresh_token",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  const userUpdated = await updateAccessToken(
    email,
    response.data.access_token,
    response.data.id_token,
    response.data.expires_in
  );
  return userUpdated;
}

const updateAccessToken = async (email, access_token, id_token, expires_in) => {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: {
        accessToken: access_token,
        idToken: id_token,
        tokenExpiry: new Date(Date.now() + expires_in * 1000),
      },
    });
    return user; // Return the updated user if needed
  } catch (error) {
    console.error("Error updating access token:", error);
    throw new Error("Failed to update access token");
  }
};
