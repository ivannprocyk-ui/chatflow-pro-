import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./src/react-app/index.css";
import AppNew from "./src/react-app/AppNew.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppNew />
  </StrictMode>
);
