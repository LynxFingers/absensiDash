import React from 'react';
import { Link } from 'react-router-dom';

// Komponen ini menerima props: id, namaKelas, dan kodeKelas dari DosenDashboard
const ClassCard = ({ id, namaKelas, kodeKelas }) => {
  return (
    // Seluruh kartu adalah sebuah Link yang mengarah ke halaman detail
    <Link to={`/kelas/${id}`} className="block p-6 bg-white rounded-xl shadow hover:shadow-lg transition-shadow border border-gray-200 cursor-pointer">
      <div className="flex flex-col h-full">
        {/* Bagian Atas: Nama dan Kode */}
        <div className="flex-grow">
          <h4 className="font-bold text-lg text-gray-800 truncate">{namaKelas}</h4>
          <p className="text-sm text-gray-500 mt-1">Kode: {kodeKelas}</p>
        </div>
        
        {/* Bagian Bawah: Ajakan Aksi */}
        <div className="mt-4 flex justify-end">
          <span className="text-blue-600 font-semibold text-sm">
            Kelola Kelas →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ClassCard;