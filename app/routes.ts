import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  layout("./dashboard/layout.jsx", [
    route("/:teamId", "./routes/dashboardOutlet.jsx", [
      route("", "./routes/dashboard/dashboard.jsx"),
      route("ledger", "./routes/dashboard/ledger.jsx"),
      route("sources", "./routes/team/sources.jsx"),
      route("categories", "./routes/team/categories.jsx"),
      route("manage-team", "./routes/team/manage-team.jsx"),
    ]),
  ]),
  route("api/:teamId/fetch-transactions/:startDate/:endDate", "./api/fetch-transactions.js"),
  route("logout", "./routes/auth/logout.jsx"),
  route("login", "./routes/auth/login.jsx"),
  route("api/create-user", "./api/create-user.js"),
  route("api/fetch-token", "./api/fetch-token.js"),
  route("api/fetch-email", "./api/fetch-email.js"),
  route("api/extract-info", "./api/extract-info.js"),
  route("api/add/:sourceId", "./api/add-transaction.js"),

  route("api/debug-ledger/:ledgerId", "./api/debug-ledger.js"),
  route("api/delete-transaction/:ledgerId", "./api/delete-transaction.js"),
] satisfies RouteConfig;
