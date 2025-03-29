import { useEffect } from "react";
import { Outlet } from "react-router";
import axios from "axios";
import { useAuthStore } from "~/utils/store";
import { parseCookies } from "~/utils/helperFunctions";
import {
  findUserByEmail,
  refreshToken,
  verifyIdToken,
} from "~/utils/authHelpers";

export async function loader({ request, params }) {
  const header = Object.fromEntries(request.headers);
  const cookie = parseCookies(header.cookie);
  if (!cookie) {
    return {
      auth: false,
      valid: false,
    };
  }
  const verifyUser = await verifyIdToken(cookie.user);
  let user;
  if (verifyUser.auth === false && verifyUser.email) {
    user = await refreshToken(verifyUser.email);
  } else {
    user = await findUserByEmail(verifyUser.email);
  }
  if (!user || !user.teams) {
    return {
      auth: verifyUser.auth,
      valid: false,
    };
  }
  const teamId = Number(params.teamId);
  const hasAccess = user.teams.some((team) => team.teamId === teamId);
  if (!hasAccess) {
    return {
      auth: verifyUser.auth,
      valid: false,
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
    if (loaderData?.auth === false && loaderData.user) {
      setUser(loaderData.user);
    }
  }, [loaderData, setUser]);

  if (!loaderData?.valid) {
    return null;
  }
  return <Outlet />;
}
