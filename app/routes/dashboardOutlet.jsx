import { Outlet, redirect } from "react-router";
import { parseCookies } from "~/utils/helperFunctions";
import {
  findUserByEmail,
  refreshToken,
  verifyIdToken,
} from "~/utils/authHelpers";
import { useAuthStore } from "~/utils/store";
import { useEffect } from "react";

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

  const teamId = Number(params.teamId);
  const hasAccess = user.teams.some((team) => team.teamId === teamId);

  if (!hasAccess) {
    return {
      auth: verifyUser.auth,
      valid: true,
      user,
    };
  }

  return {
    auth: verifyUser.auth,
    valid: true,
    user,
  };
}

export default function DashboardOutlet({ loaderData }) {
  const setUser = useAuthStore((state) => state.setUser);
  
  useEffect(() => {
    if (loaderData && !loaderData.auth) {
      setUser(loaderData.user);
      document.cookie = `user=${loaderData.user.idToken}; path=/; max-age=${
        60 * 60 * 24 * 7
      }`;
    }
  }, [loaderData]);

  return <Outlet />;
}
