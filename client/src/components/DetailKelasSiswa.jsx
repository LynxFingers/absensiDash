import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header'; // Asumsi header yang sama

// Komponen banner untuk halaman ini
const ClassDetailBanner = ({ className }) => (
  <div className="bg-blue-500 text-white p-6 rounded-lg shadow-md">
    <p className="text-sm font-semibold text-blue-100">Anda Terdaftar di Kelas</p>
    <h2 className="text-3xl font-bold">{className}</h2>
  </div>
);

const DetailKelasSiswa = () => {
  const { id: kelasId } = useParams();
  const [kelas, setKelas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKelasDetail = async () => {
      try {
        setLoading(true);
        // Kita tetap bisa menggunakan endpoint detail kelas yang sama
        const response = await axios.get(`http://localhost:3001/api/kelas/${kelasId}`);
        setKelas(response.data);
      } catch (error) {
        console.error("Gagal mengambil detail kelas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchKelasDetail();
  }, [kelasId]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Memuat...</div>;
  }

  if (!kelas) {
    return <div className="flex h-screen items-center justify-center">Kelas tidak ditemukan.</div>;
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-7xl mx-auto">
        {/* Tombol kembali ke dasbor siswa */}
        <Link to="/siswa" className="text-sm font-semibold text-blue-600 hover:underline mb-6 inline-block">
          &larr; Kembali ke Dasbor
        </Link>
        
        <ClassDetailBanner className={kelas.namaKelas} />
        
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800">Detail & Absensi</h3>
          <div className="mt-4 p-6 bg-gray-50 rounded-lg min-h-[20rem] flex flex-col items-center justify-center">
            <p className="text-gray-600 mb-4">Informasi sesi absensi dan tombol untuk melakukan absen akan muncul di sini.</p>
            <button className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors">
              Lakukan Absensi Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailKelasSiswa;