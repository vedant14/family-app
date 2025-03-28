import { OAuth2Client } from "google-auth-library";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

export async function verifyIdToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID, // Ensure the token was issued for your app
    });

    const payload = ticket.getPayload();
    console.log("User Info:", payload);

    return payload; // Contains user details (email, name, picture, etc.)
  } catch (error) {
    console.error("Invalid ID Token:", error);
    return null;
  }
}
