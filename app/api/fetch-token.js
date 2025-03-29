import axios from "axios";
import { findUserByEmail } from "~/utils/authHelpers";

import prisma from "~/utils/prismaClient";

export const action = async ({ request }) => {
  try {
    const { code, email } = await request.json(); // Ensure request body is properly parsed

    if (!code && !email) {
      return new Response(
        JSON.stringify({ error: "Either 'code' or 'email' is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI;
    let response;
    if (code) {
      console.log("Exchange authorization code for access token");
      response = await axios.post(
        "https://oauth2.googleapis.com/token",
        new URLSearchParams({
          code,
          client_id,
          client_secret,
          redirect_uri,
          grant_type: "authorization_code",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      return new Response(
        JSON.stringify(response.data), // Ensure response format is consistent
        { headers: { "Content-Type": "application/json" } }
      );
    } else {
      console.log("Refresh access token using stored refresh token");
      const user = await findUserByEmail(email);
      if (!user || !user.refreshToken) {
        return new Response(
          JSON.stringify({ error: "User not found or refresh token missing" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      response = await axios.post(
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

      return new Response(
        JSON.stringify({
          success: true,
          user: userUpdated,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error(
      "Token exchange error:",
      error.response?.data || error.message
    );

    return new Response(
      JSON.stringify({
        error: "Unexpected error occurred",
        details: error.response?.data || error.message,
      }),
      {
        status: error.response?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

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
