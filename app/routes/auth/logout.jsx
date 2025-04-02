import { useEffect } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useAuthStore } from "~/utils/store";

export default function DashboardOutlet() {
  const setUser = useAuthStore((state) => state.setUser);
  useEffect(() => {
    setUser(null);
    document.cookie = `user=/; path=/; max-age=${60 * 60 * 24 * 7}`;
  }, []);

  return (
    <div>
      <Link to="/login">
        <Button>Login now</Button>
      </Link>
    </div>
  );
}
