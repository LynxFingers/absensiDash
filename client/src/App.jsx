import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// SEMUA HALAMAN DI-IMPORT DARI FOLDER 'pages'
import AuthPage from './pages/AuthPage.jsx';
import DosenDashboard from './pages/DosenDashboard.jsx';
import StudentDashboard from './pages/StudentsDashboard.jsx';
import DetailKelasPage from './pages/DetailKelasPage.jsx'; // Untuk Dosen
import DetailKelasSiswa from './pages/DetailKelasSiswa.jsx'; // Untuk Siswa

const PrivateRoute = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.role === role) {
    return children;
  }
  return <Navigate to="/" />;
};

function App() {
  return (
    <div className="relative min-h-screen w-full bg-gray-50 overflow-hidden">
      {/* Latar belakang dekoratif */}
      <div className="absolute w-96 h-96 bg-orange-400 rounded-full -top-20 -left-40 z-0"></div>
      <div className="absolute w-96 h-96 bg-blue-500 rounded-full -bottom-20 -right-20 z-0"></div>

      {/* Konten Utama Aplikasi */}
      <div className="relative z-10">
        <Router>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            
            {/* Rute Dosen */}
            <Route path="/dosen" element={<PrivateRoute role="dosen"><DosenDashboard /></PrivateRoute>} />
            <Route path="/kelas/:id" element={<PrivateRoute role="dosen"><DetailKelasPage /></PrivateRoute>} />

            {/* Rute Siswa */}
            <Route path="/siswa" element={<PrivateRoute role="siswa"><StudentDashboard /></PrivateRoute>} />
            <Route 
              path="/kelas-siswa/:id" 
              element={
                <PrivateRoute role="siswa">
                  <DetailKelasSiswa />
                </PrivateRoute>
              } 
            />
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;