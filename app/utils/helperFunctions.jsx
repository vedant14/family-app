import prisma from "./prismaClient";

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
};

export const updateAccessToken = async (email, access_token, expires_in) => {
  try {
    const user = await prisma.user.update({
      where: { email },
      data: {
        accessToken: access_token,
        tokenExpiry: new Date(Date.now() + expires_in * 1000),
      },
    });
    return user; // Return the updated user if needed
  } catch (error) {
    console.error("Error updating access token:", error);
    throw new Error("Failed to update access token");
  }
};
