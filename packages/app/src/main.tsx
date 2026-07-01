import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import "ui/globals.css";
import { router } from "./router";
import { ChangelogPopup } from "./components/changelog-popup";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ChangelogPopup />
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>,
);
