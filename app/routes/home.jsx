import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "~/utils/store";

export default function HomePage() {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  useEffect(() => {
    if (selectedTeam) {
      window.location.href = `/${selectedTeam.teamId}/dashboard`;
    }
  }, [selectedTeam]);

  return <div>Wait a second</div>;
}
