import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import EveningPage from './pages/EveningPage.jsx';
import AdminPage from './pages/admin/AdminPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EveningPage />} />
      <Route path="/menu" element={<HomePage />} />
      <Route path="/admin/*" element={<AdminPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
