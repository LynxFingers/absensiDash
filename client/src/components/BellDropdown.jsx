// client/src/components/BellDropdown.jsx

import React from 'react';

const BellDropdown = ({ kodeKelas, onBuatAbsensiClick }) => {
  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-20">
      <div className="p-4">
        <p className="text-sm text-gray-500">Gunakan kode ini agar siswa bisa bergabung:</p>
        <div className="my-2 p-2 bg-gray-100 rounded-md text-center">
          <p className="font-bold text-lg text-gray-800 tracking-widest">{kodeKelas}</p>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <button 
          onClick={onBuatAbsensiClick}
          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
        >
          Buat Sesi Absensi Baru
        </button>
        {/* Nanti bisa ditambahkan menu lain di sini */}
      </div>
    </div>
  );
};

export default BellDropdown;