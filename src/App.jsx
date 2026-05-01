import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Entry from './pages/Entry';
import Home from './pages/Home';
import Games from './pages/Games';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Entry />} />
        <Route path="/her" element={<Home user="her" />} />
        <Route path="/him" element={<Home user="him" />} />
        <Route path="/her/games" element={<Games user="her" />} />
        <Route path="/him/games" element={<Games user="him" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
