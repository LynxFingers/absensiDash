import React from 'react';

// Komponen ini menerima satu prop: sebuah fungsi 'onBuatKelas'
// yang akan dijalankan saat tombol diklik.
const EmptyState = ({ onBuatKelas }) => {
  return (
    <div className="text-center py-16 px-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      <h3 className="mt-2 text-xl font-semibold text-gray-900">Belum Ada Kelas</h3>
      <p className="mt-1 text-sm text-gray-500">Anda belum membuat kelas sama sekali. Mari mulai dengan membuat kelas pertama Anda.</p>
      <div className="mt-6">
        <button
          onClick={onBuatKelas}
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          + Buat Kelas Pertama Anda
        </button>
      </div>
    </div>
  );
};

export default EmptyState;