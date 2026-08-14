import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AdminPage } from "./AdminPage";
import App from "./App";
import { MyOrdersPage } from "./MyOrdersPage";

const routes = {
  "/": App,
  "/admin": AdminPage,
  "/orders": MyOrdersPage
};

const Page = routes[window.location.pathname as keyof typeof routes] ?? App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Page />
  </StrictMode>
);
