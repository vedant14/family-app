import { Outlet, redirect } from "react-router";
import { parseCookies } from "~/utils/helperFunctions";
import {
  findUserByEmail,
  refreshToken,
  verifyIdToken,
} from "~/utils/authHelpers";
import { useAuthStore } from "~/utils/store";

export async function loader({ request, params }) {
  const header = Object.fromEntries(request.headers);
  const cookie = parseCookies(header.cookie);
  if (!cookie) {
    return redirect("/login"); // Redirect if no cookie
  }
  const verifyUser = await verifyIdToken(cookie.user);
  let user;
  if (verifyUser.auth === false && verifyUser.email) {
    user = await refreshToken(verifyUser.email);
  } else {
    user = await findUserByEmail(verifyUser.email);
  }
  if (!user || !user.teams) {
    return redirect("/login"); // Redirect if user not found
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
  if (!loaderData.auth && loaderData.user) {
    setUser(loaderData.user);
  }

  return <Outlet />;
}
