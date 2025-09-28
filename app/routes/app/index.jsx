import { useLoaderData } from "react-router";
import { fetchTeamUser } from "~/models/fetchTeamUser";

export const loader = async ({ params }) => {
  const data = await fetchTeamUser();
  return { data };
};

export default function App() {
  const { data } = useLoaderData();
  console.log(data);
  return <div className="">New APP</div>;
}
