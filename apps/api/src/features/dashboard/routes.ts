import { Hono } from "hono";
import { getDashboardRoute } from "./get-dashboard/route";

export const dashboardRoutes = new Hono();

dashboardRoutes.route("/", getDashboardRoute);
