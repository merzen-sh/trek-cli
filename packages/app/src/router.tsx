import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { RootLayout } from "./routes/__root";
import { HomePage } from "./routes/index";
import { OverviewPage } from "./routes/overview";
import { ThemeEditorPage } from "./routes/theme";
import { ConfigEditorPage } from "./routes/config";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/overview",
  component: OverviewPage,
});

const themeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/theme",
  component: ThemeEditorPage,
});

const configRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/config",
  component: ConfigEditorPage,
});

const routeTree = rootRoute.addChildren([indexRoute, overviewRoute, themeRoute, configRoute]);

export const router = createRouter({ routeTree });

// Register the router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
