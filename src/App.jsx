import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Search from "./pages/Search";
import Library from "./pages/Library";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Watch from "./pages/Watch";
import Collection from "./pages/Collection";
import Artist from "./pages/Artist";
import Category from "./pages/Category";
import LocalPlaylist from "./pages/LocalPlaylist";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/search" element={<Search />} />
        <Route path="/mood/:slug" element={<Category />} />
        <Route path="/album/:id" element={<Collection kind="album" />} />
        <Route path="/playlist/:id" element={<Collection kind="playlist" />} />
        <Route path="/artist/:id" element={<Artist />} />
        <Route path="/library" element={<Library />} />
        <Route path="/library/liked" element={<LocalPlaylist liked />} />
        <Route path="/library/playlist/:id" element={<LocalPlaylist />} />
        <Route path="/library/:tab" element={<Library />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/watch" element={<Watch />} />
        {/* Old routes from the pre-rebuild app, kept so bookmarks still land. */}
        <Route path="/player" element={<Navigate to="/" replace />} />
        <Route path="/playlists" element={<Navigate to="/library/playlists" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
