import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "~/utils/store";

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function Product({ loaderData }) {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/" + selectedTeam.teamId);
  }, [selectedTeam]);

  return <div>VEDANT</div>;
}
