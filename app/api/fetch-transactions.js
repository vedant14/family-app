import { redirect } from "react-router";
import { findUserByEmail, verifyIdToken } from "~/utils/authHelpers";
import { endOfMonthUTC, startOfMonthUTC } from "~/utils/dateHelpers";
import { parseCookies } from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";

export async function loader({ request, params }) {
  const header = Object.fromEntries(request.headers);
  const cookie = parseCookies(header.cookie);
  if (!cookie) {
    return redirect("/login", {
      headers: {
        "Set-Cookie": "user=; path=/; max-age=0",
      },
    });
  }
  const verifyUser = await verifyIdToken(cookie.user);
  if (!verifyUser) {
    return redirect("/login", {
      headers: {
        "Set-Cookie": "user=; path=/; max-age=0",
      },
    });
  }
  let user;
  if (verifyUser.auth === false && verifyUser.email) {
    user = await refreshToken(verifyUser.email);
  } else {
    user = await findUserByEmail(verifyUser.email);
  }
  if (!user || !user.teams) {
    return redirect("/login", {
      headers: {
        "Set-Cookie": "user=; path=/; max-age=0",
      },
    });
  }

  const { teamId } = params;
  const startDateParam = params.startDate;
  const endDateParam = params.endDate;

  let startDate;
  let endDate;

  if (startDateParam) {
    startDate = new Date(startDateParam);
    if (isNaN(startDate.getTime())) {
      throw new Error("Invalid startDate");
    }
  }
  if (endDateParam) {
    endDate = new Date(endDateParam);
    if (isNaN(endDate.getTime())) {
      throw new Error("Invalid endDate");
    }
  }

  if (startDate && endDate && endDate < startDate) {
    throw new Error("endDate cannot be earlier than startDate");
  }

  let whereClause = {
    user: {
      teamId: Number(teamId),
    },
    status: {
      in: ["CREATED", "EXTRACTED", "MANUAL"],
    },
  };

  if (startDate && endDate) {
    whereClause.date = {
      gte: startDate,
      lte: endDate,
    };
  } else if (startDate) {
    whereClause.date = {
      gte: startDate,
    };
  } else if (endDate) {
    whereClause.date = {
      lte: endDate,
    };
  } else {
    const nowUTC = new Date();
    const nowForUTC = new Date(nowUTC.toISOString());
    const thisMonthRange = {
      gte: startOfMonthUTC(nowForUTC),
      lte: endOfMonthUTC(nowForUTC),
    };
    whereClause.date = thisMonthRange;
  }

  const transactions = await prisma.ledger.findMany({
    select: {
      id: true,
      date: true,
      transactionTypeExtract: true,
      emailId: true,
      emailSubject: true,
      tags: {
        select: {
          tag: true,
        },
      },
      amountExtract: true,
      categoryId: true,
      payeeExtract: true,
      category: {
        select: {
          id: true,
          colorCode: true,
          categoryName: true,
        },
      },
      user: {
        select: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
      source: {
        select: {
          sourceName: true,
        },
      },
    },
    where: whereClause,
    orderBy: {
      date: "desc",
    },
  });

  return { transactions };
}
