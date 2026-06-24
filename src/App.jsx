import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import Search from "./pages/Search";
import PlayerPage from "./pages/Player";
import Library from "./pages/Library";
import Playlists from "./pages/Playlists";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/library" element={<Library />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
