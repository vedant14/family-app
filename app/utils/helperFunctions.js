import prisma from "~/utils/prismaClient";

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
