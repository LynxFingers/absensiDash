import React from 'react';

const ClassAttendanceCard = ({ className, studentCount }) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-gray-800">{className}</h4>
        <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{studentCount}</span>
      </div>
      <div className="flex items-center justify-between mt-6">
        {/* Lingkaran seperti radio button */}
        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
        <div className="flex items-center space-x-3">
          <button className="text-xs bg-yellow-400 text-white px-3 py-1.5 rounded-md hover:bg-yellow-500 font-semibold">
            Absen Data
          </button>
          <button className="text-xs text-gray-500 hover:text-gray-800 font-semibold">
            Arsip Absensi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassAttendanceCard;