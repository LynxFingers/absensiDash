import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Impor Link

import Header from '../components/Hsiswa';
import MainAttendanceCard from '../components/MainattendanceCard';
import RecentAttendance from '../components/Kalender';
import StudentClassCard from '../components/StudentClassCard';

// Komponen untuk Tampilan Kosong
const EmptyState = ({ onJoinClick }) => (
  <div className="text-center border-2 border-dashed border-gray-300 rounded-xl p-8 sm:p-12 mt-6">
    <div className="mx-auto w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full">
      <span className="text-2xl font-bold text-gray-400">+</span>
    </div>
    <h3 className="mt-4 text-lg font-semibold text-gray-800">Anda Belum Bergabung Kelas</h3>
    <p className="mt-2 text-sm text-gray-500">
      Minta kode kelas dari dosen Anda dan klik tombol di bawah untuk bergabung.
    </p>
    <button
      onClick={onJoinClick}
      className="mt-6 bg-green-500 text-white font-semibold py-2 px-5 rounded-lg hover:bg-green-600 transition-colors text-sm"
    >
      + Join Kelas Sekarang
    </button>
  </div>
);

function StudentDashboard() {
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kodeKelas, setKodeKelas] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchEnrolledClasses = async () => {
    // Selalu set loading ke true di awal
    setLoading(true);
    
    // Validasi user di awal
    if (!user || !user.id || user.role !== 'siswa') {
      console.log("User tidak valid atau bukan siswa, proses dihentikan.");
      setLoading(false); // Pastikan loading berhenti jika user tidak valid
      return;
    }
    
    try {
      const response = await axios.get(`http://localhost:3001/api/students/${user.id}/classes`);
      setEnrolledClasses(response.data);
    } catch (error) {
      console.error("Gagal mengambil data kelas:", error);
      setEnrolledClasses([]); // Tetap set sebagai array kosong jika error
    } finally {
      // PERBAIKAN UTAMA: Blok finally akan SELALU dijalankan
      // Ini menjamin loading akan selalu berhenti.
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledClasses();
  }, []); // Hanya berjalan sekali saat komponen dimuat

  const handleJoinKelas = async (e) => {
    e.preventDefault();
    if (!user || !user.id) {
        return alert('Informasi user tidak ditemukan. Silakan login ulang.');
    }
    
    try {
      const response = await axios.post('http://localhost:3001/api/kelas/join', {
        kodeKelas: kodeKelas,
        siswaId: user.id 
      });

      if (response.status === 200) {
        alert('Berhasil bergabung dengan kelas!');
        setIsModalOpen(false);
        setKodeKelas('');
        fetchEnrolledClasses();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gagal bergabung dengan kelas.';
      alert(errorMessage);
    }
  };

  const handleLeaveClass = async (kelasId) => {
        if (window.confirm('Apakah Anda yakin ingin keluar dari kelas ini? Semua riwayat absensi Anda di kelas ini akan dihapus.')) {
            try {
                await axios.delete(`http://localhost:3001/api/kelas/${kelasId}/leave`, {
                    data: { siswaId: user.id } // Kirim siswaId di dalam body untuk request DELETE
                });
                alert('Anda berhasil keluar dari kelas.');
                fetchEnrolledClasses(); // Refresh daftar kelas
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal keluar dari kelas.');
            }
        }
    };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="bg-gray-100 rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-7xl mx-auto">
        <Header />
        
        <div className="flex justify-center my-8">
            <div className="w-full max-w-4xl space-y-8">
                <MainAttendanceCard 
                    selectedDate={selectedDate} 
                    setSelectedDate={setSelectedDate} 
                    userName={user ? user.name : 'Siswa'}
                />
                <RecentAttendance 
                    selectedDate={selectedDate} 
                    
                />
            </div>
        </div>
        </div>

        <div className="mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-7xl mx-auto">  
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Kelas yang Diikuti</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              + Join Kelas
            </button>
          </div>
          
          
          {/* Bagian ini sekarang akan berfungsi dengan benar */}
          {loading ? (
            <p className="text-center text-gray-500 py-8">Memuat data kelas...</p>
          ) : enrolledClasses.length === 0 ? (
            <EmptyState onJoinClick={() => setIsModalOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {enrolledClasses.map(cls => (
                <StudentClassCard key={cls.id} id={cls.id} namaKelas={cls.namaKelas} kodeKelas={cls.kodeKelas} onLeave={handleLeaveClass}  />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

       {isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Gabung ke Kelas Baru</h2>
      <form onSubmit={handleJoinKelas}>
        <label htmlFor="kodeKelas" className="block text-sm font-medium text-gray-700">Kode Kelas</label>
        <input
          type="text"
          id="kodeKelas"
          value={kodeKelas}
          onChange={(e) => setKodeKelas(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Masukkan kode unik dari dosen"
          required
        />
        <div className="mt-6 flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={() => setIsModalOpen(false)} 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold"
          >
            Batal
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
          >
            Gabung
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}

export default StudentDashboard;