import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ClassCard from '../components/ClassCard';
import EmptyState from '../components/EmptyState';
import MainAttendanceCard from '../components/MainattendanceCard';
import RecentAttendance from '../components/Kalender';

function DosenDashboard() {
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [namaKelasBaru, setNamaKelasBaru] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Mengambil data user dari localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  // FUNGSI UNTUK MENGAMBIL DATA KELAS DARI SERVER
  const fetchKelas = async () => {
    // Pastikan user ada dan perannya adalah dosen
    if (!user || !user.id || user.role !== 'dosen') {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Panggil API backend untuk mendapatkan kelas milik dosen yang login
      const response = await axios.get(`http://localhost:3001/api/kelas?dosenId=${user.id}`);
      setDaftarKelas(response.data);
    } catch (error) {
      console.error("Gagal mengambil data kelas:", error);
      // Set daftar kelas menjadi array kosong jika terjadi error
      setDaftarKelas([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect AKAN MEMANGGIL fetchKelas() SAAT KOMPONEN PERTAMA KALI DITAMPILKAN
  useEffect(() => {
    fetchKelas();
  }, []); // Array kosong berarti efek ini hanya berjalan sekali

  // FUNGSI UNTUK MENANGANI PENAMBAHAN KELAS BARU
  const handleTambahKelas = async (e) => {
    e.preventDefault();
    if (!user) return alert('Anda harus login untuk membuat kelas');
    try {
      const response = await axios.post('http://localhost:3001/api/kelas', {
        namaKelas: namaKelasBaru,
        dosenId: user.id 
      });

      if (response.status === 201) {
        alert('Kelas berhasil dibuat!');
        setIsModalOpen(false);
        setNamaKelasBaru('');
        fetchKelas(); // Ambil ulang daftar kelas agar kelas baru langsung muncul
      }
    } catch (error) {
      alert('Gagal membuat kelas.');
      console.error("Gagal membuat kelas:", error);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center p-4">
            <div className="bg-gray-100 rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-7xl">
        <Header />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-6">
          <div className="lg:col-span-2 space-y-6">
            <MainAttendanceCard 
              selectedDate={selectedDate} 
              setSelectedDate={setSelectedDate} 
              userName={user ? user.name : ''}
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
            <h3 className="text-xl font-bold text-gray-800">Absensi Kelas</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              + Tambah Kelas
            </button>
          </div>
          
          {loading ? (
            <p className="text-center text-gray-500 py-8">Memuat data kelas...</p>
          ) : daftarKelas.length === 0 ? (
            <EmptyState onBuatKelas={() => setIsModalOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {daftarKelas.map(cls => (
                <ClassCard key={cls.id} id={cls.id} namaKelas={cls.namaKelas} kodeKelas={cls.kodeKelas} />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

       {isModalOpen && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
             <h2 className="text-2xl font-bold mb-4">Buat Kelas Baru</h2>
             <form onSubmit={handleTambahKelas}>
               <label htmlFor="namaKelas" className="block text-sm font-medium text-gray-700">Nama Kelas</label>
               <input
                 type="text"
                 id="namaKelas"
                 value={namaKelasBaru}
                 onChange={(e) => setNamaKelasBaru(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                 placeholder="Contoh: XII RPL A"
                 required
               />
               <div className="mt-6 flex justify-end space-x-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Simpan Kelas</button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
}

export default DosenDashboard;