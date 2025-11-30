import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import { HomePage } from "./pages/home";
import { ModulesPage } from "./pages/modules";
import { PublicProfilePage } from "./pages/public-profile";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "modules", element: <ModulesPage /> }
    ]
  },
  {
    path: "/:username",
    element: <PublicProfilePage />
  }
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
