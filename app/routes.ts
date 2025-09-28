import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/app/layout.jsx", [
    index("routes/app/index.jsx"),
  ]),
] satisfies RouteConfig;
