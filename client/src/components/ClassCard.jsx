import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ClassCard({ id, namaKelas, kodeKelas, onUpdate, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                    <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">{namaKelas}</h5>
                    <div className="relative">
                        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full hover:bg-gray-100">
                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                                <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); onUpdate(); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit Kelas</a>
                                <a href="#" onClick={(e) => { e.preventDefault(); setMenuOpen(false); onDelete(); }} className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Hapus Kelas</a>
                            </div>
                        )}
                    </div>
                </div>
                <p className="mb-3 font-normal text-gray-500">Kode: <span className="font-mono bg-gray-100 p-1 rounded">{kodeKelas}</span></p>
            </div>
            <div className="px-5 pb-5">
                 <Link to={`/dosen/kelas/${id}`} className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300">
                    Kelola Kelas
                    <svg className="w-3.5 h-3.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/></svg>
                </Link>
            </div>
        </div>
    );
}

export default ClassCard;