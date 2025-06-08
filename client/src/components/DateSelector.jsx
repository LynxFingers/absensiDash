// client/src/components/DateSelector.jsx
import React from 'react';

// Fungsi untuk memformat tanggal ke YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

const DateSelector = ({ selectedDate, onDateChange }) => {
  // Membuat 7 hari terakhir dari hari ini
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  const getDayName = (date) => {
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Riwayat Absensi Siswa</h3>
        {/* Tombol "Bulan" bisa dikembangkan nanti */}
        <button className="text-sm font-semibold text-gray-600 bg-gray-200 px-3 py-1 rounded-md">Bulan</button>
      </div>
      <div className="flex justify-between items-center space-x-2">
        {dates.map((date) => {
          const dateString = formatDate(date);
          const isSelected = dateString === selectedDate;

          return (
            <button 
              key={dateString}
              onClick={() => onDateChange(dateString)}
              className={`flex flex-col items-center justify-center w-16 h-20 rounded-lg transition-all duration-200
                ${isSelected 
                  ? 'bg-red-500 text-white shadow-md scale-105' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <span className="text-xs">{getDayName(date).substring(0,3)}</span>
              <span className="font-bold text-2xl">{date.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateSelector;