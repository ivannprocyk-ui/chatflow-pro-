import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/react-app/index.css";
import AppNew from "@/react-app/AppNew.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppNew />
  </StrictMode>
);
