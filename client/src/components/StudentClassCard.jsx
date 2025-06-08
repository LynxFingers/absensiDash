import React from 'react';
import { Link } from 'react-router-dom';

const StudentClassCard = ({ id, namaKelas, kodeKelas }) => {
  return (
    // Link akan mengarah ke halaman detail kelas khusus siswa
    <Link to={`/kelas-siswa/${id}`} className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 hover:shadow-lg transition-all">
      <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">{namaKelas}</h5>
      <p className="font-normal text-sm text-gray-600">Kode: {kodeKelas}</p>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm font-semibold text-blue-600">Lihat Detail & Absen</p>
      </div>
    </Link>
  );
};

export default StudentClassCard;