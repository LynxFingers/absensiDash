// client/src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import BellDropdown from './BellDropdown';

// Header sekarang menerima props `kodeKelas` dan `onBuatAbsensiClick`
const Header = ({ kodeKelas, onBuatAbsensiClick }) => {
  // State untuk mengontrol visibilitas dropdown lonceng
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Efek untuk menutup dropdown saat klik di luar area
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="flex justify-between items-center py-4">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard Mahasiswa</h1>
      <div className="flex items-center space-x-4">
        {/* <div className="relative w-64">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div> */}
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Tombol lonceng untuk buka/tutup dropdown
            className="p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a3 3 0 00-6 0v.083A6 6 0 002 11v3.159c0 .538-.214 1.055-.595 1.436L0 17h5m10 0v1a3 3 0 01-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          {/* Tampilkan dropdown JIKA isDropdownOpen true DAN ada fungsi onBuatAbsensiClick */}
          {isDropdownOpen && onBuatAbsensiClick && (
            <BellDropdown 
              kodeKelas={kodeKelas}
              onBuatAbsensiClick={() => {
                onBuatAbsensiClick();      // Jalankan fungsi dari parent (DetailKelasPage)
                setIsDropdownOpen(false);  // Langsung tutup dropdown setelah diklik
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;