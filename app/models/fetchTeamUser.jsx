import prisma from "~/utils/prismaClient";

export async function fetchTeamUser() {
  return await prisma.team.findMany();
}
