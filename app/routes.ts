import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("./dashboard/layout.jsx", [
    index("routes/dashboard/index.jsx"),
    route("test", "./routes/home.jsx"),
  ]),
  route("login", "./routes/auth/login.jsx"),
  route("api/fetch-sources", "./api/fetch-sources.jsx"),
] satisfies RouteConfig;
