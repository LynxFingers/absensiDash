import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const StudentClassCard = ({ id, namaKelas, onLeave }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    // Fungsi ini dipanggil saat tombol/link "Keluar Kelas" di klik
    const handleLeaveClick = () => {
        // Panggil fungsi onLeave dari props dan kirimkan ID kelas ini
        onLeave(id); 
        setMenuOpen(false);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h5 className="text-xl font-bold tracking-tight text-gray-900 break-words">{namaKelas}</h5>
                    <div className="relative flex-shrink-0 ml-2">
                       
                        
                    </div>
                </div>
            </div>
            <div className="px-5 pb-5 pt-2">
                 <Link to={`/kelas-siswa/${id}`} className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300">
                     Lihat Detail
                     <svg className="w-3.5 h-3.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/></svg>
                 </Link>
            </div>
        </div>
    );
};

export default StudentClassCard;