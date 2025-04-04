import axios from "axios";
import { findUserByEmail } from "~/utils/authHelpers";

import prisma from "~/utils/prismaClient";

// Add error types
const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTHENTICATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  SERVER: 'SERVER_ERROR',
};

// Add error response helper
const createErrorResponse = (type, message, details = null, status = 400) => {
  return new Response(
    JSON.stringify({
      error: type,
      message,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp: new Date().toISOString(),
    }),
    { 
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

export const action = async ({ request }) => {
  try {
    const { code, email } = await request.json();

    // Validation
    if (!code && !email) {
      return createErrorResponse(
        ErrorTypes.VALIDATION,
        "Either 'code' or 'email' is required"
      );
    }

    const client_id = process.env.GOOGLE_CLIENT_ID;
    const client_secret = process.env.GOOGLE_CLIENT_SECRET;
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

    // Validate required environment variables
    if (!client_id || !client_secret || !redirect_uri) {
      console.error('Missing required environment variables');
      return createErrorResponse(
        ErrorTypes.SERVER,
        "Server configuration error",
        "Missing OAuth credentials",
        500
      );
    }

    if (code) {
      try {
        const response = await axios.post(
          "https://oauth2.googleapis.com/token",
          new URLSearchParams({
            code,
            client_id,
            client_secret,
            redirect_uri,
            grant_type: "authorization_code",
          }),
          { 
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 5000 // 5 second timeout
          }
        );

        return new Response(
          JSON.stringify(response.data),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (error) {
        if (error.response?.status === 429) {
          return createErrorResponse(
            ErrorTypes.RATE_LIMIT,
            "Too many requests, please try again later",
            error.response.data,
            429
          );
        }
        throw error; // Let the main error handler deal with other errors
      }
    } else {
      const user = await findUserByEmail(email);
      
      if (!user) {
        return createErrorResponse(
          ErrorTypes.NOT_FOUND,
          "User not found",
          null,
          404
        );
      }

      if (!user.refreshToken) {
        return createErrorResponse(
          ErrorTypes.AUTH,
          "Refresh token not found, please re-authenticate",
          null,
          401
        );
      }

      try {
        const response = await axios.post(
          "https://oauth2.googleapis.com/token",
          new URLSearchParams({
            refresh_token: user.refreshToken,
            client_id,
            client_secret,
            grant_type: "refresh_token",
          }),
          { 
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 5000
          }
        );

        const userUpdated = await updateAccessToken(
          email,
          response.data.access_token,
          response.data.id_token,
          response.data.expires_in
        );

        return new Response(
          JSON.stringify({ success: true, user: userUpdated }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (error) {
        if (error.response?.status === 400) {
          return createErrorResponse(
            ErrorTypes.AUTH,
            "Invalid or expired refresh token",
            error.response.data,
            401
          );
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("Token exchange error:", {
      message: error.message,
      stack: error.stack,
      responseData: error.response?.data
    });

    return createErrorResponse(
      ErrorTypes.SERVER,
      "An unexpected error occurred",
      error.response?.data || error.message,
      error.response?.status || 500
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
    console.error("Error updating access token:", {
      email,
      error: error.message,
      stack: error.stack
    });
    throw new Error("Failed to update access token");
  }
};
