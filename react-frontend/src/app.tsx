import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Routes, Route, HashRouter } from "react-router";
import { ThemeProvider } from "@/components/theme-provider";
import HomePage from "@/pages/home";
import EditChannelPage from "@/pages/edit-channel";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <HashRouter>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="ch/:channel">
            <Route path="edit" element={<EditChannelPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

// This should be in a separate file
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

export default App;
