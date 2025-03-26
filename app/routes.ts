import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/dashboard.tsx"),
  route("test", "./routes/home.jsx"),
  route("api/fetch-sources", "./api/fetch-sources.jsx"),
] satisfies RouteConfig;
