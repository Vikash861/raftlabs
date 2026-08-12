import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AdminPage } from "./AdminPage";
import App from "./App";

const Page = window.location.pathname === "/admin" ? AdminPage : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Page />
  </StrictMode>
);
