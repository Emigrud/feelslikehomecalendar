import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("redirects the old /index preview address to the calendar", async () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const alias = router.matchRoutes("/index").at(-1);
    expect(alias?.routeId).toBe("/index");
    const route = router.routesById["/index"];
    const beforeLoad = route.options.beforeLoad;
    expect(beforeLoad).toBeTypeOf("function");
    // Redirect-only beforeLoad does not read the router context.
    if (!beforeLoad) throw new Error("Missing preview redirect");
    try {
      await beforeLoad({} as NonNullable<Parameters<typeof beforeLoad>[0]>);
      throw new Error("Expected /index to redirect");
    } catch (result) {
      expect(result).toMatchObject({ options: { to: "/", replace: true } });
    }
  });
});
