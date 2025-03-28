import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("./dashboard/layout.jsx", [
    index("routes/dashboard/index.jsx"),
    route("test", "./routes/home.jsx"),
    route("sources", "./routes/dashboard/sources.jsx"),
  ]),
  route("login", "./routes/auth/login.jsx"),
  route("api/create-user", "./api/create-user.js"),
  route("api/fetch-token", "./api/fetch-token.js"),
  route("api/create-source", "./api/create-source.js"),
] satisfies RouteConfig;
