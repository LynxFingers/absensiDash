import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import ClassCard from '../components/ClassCard';
import EmptyState from '../components/EmptyState';
import MainAttendanceCard from '../components/MainattendanceCard';
import RecentAttendance from '../components/Kalender';

function DosenDashboard() {
    const [daftarKelas, setDaftarKelas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // State untuk modal create
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [namaKelasBaru, setNamaKelasBaru] = useState('');

    // --- STATE BARU UNTUK MODAL UPDATE ---
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [editingKelas, setEditingKelas] = useState(null);
    const [updatedNamaKelas, setUpdatedNamaKelas] = useState('');

    const user = JSON.parse(localStorage.getItem('user'));

    const fetchKelas = async () => {
        if (!user || user.role !== 'dosen') {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:3001/api/kelas?dosenId=${user.id}`);
            setDaftarKelas(response.data);
        } catch (error) {
            console.error("Gagal mengambil data kelas:", error);
            setDaftarKelas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleTambahKelas = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3001/api/kelas', { namaKelas: namaKelasBaru, dosenId: user.id });
            alert('Kelas berhasil dibuat!');
            setIsCreateModalOpen(false);
            setNamaKelasBaru('');
            fetchKelas();
        } catch (error) {
            alert('Gagal membuat kelas.');
        }
    };

    // --- FUNGSI BARU UNTUK DELETE KELAS ---
    const handleDeleteKelas = async (kelasId) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus kelas ini? Semua data sesi dan absensi terkait akan ikut terhapus secara permanen.')) {
            try {
                await axios.delete(`http://localhost:3001/api/kelas/${kelasId}`);
                alert('Kelas berhasil dihapus.');
                fetchKelas();
            } catch (error) {
                alert('Gagal menghapus kelas.');
            }
        }
    };

    // --- FUNGSI BARU UNTUK MEMBUKA MODAL UPDATE ---
    const openUpdateModal = (kelas) => {
        setEditingKelas(kelas);
        setUpdatedNamaKelas(kelas.namaKelas);
        setIsUpdateModalOpen(true);
    };
    
    // --- FUNGSI BARU UNTUK MENANGANI SUBMIT UPDATE ---
    const handleUpdateKelas = async (e) => {
        e.preventDefault();
        if (!editingKelas) return;
        try {
            await axios.put(`http://localhost:3001/api/kelas/${editingKelas.id}`, { namaKelas: updatedNamaKelas });
            alert('Kelas berhasil diperbarui!');
            setIsUpdateModalOpen(false);
            setEditingKelas(null);
            fetchKelas();
        } catch (error) {
            alert('Gagal memperbarui kelas.');
        }
    };

    return (
        <div className="w-full bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-7xl mx-auto space-y-8">
                {/* Bagian Atas: Header dan Kalender */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    <Header />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-6">
                        <div className="lg:col-span-2 space-y-6">
                            <MainAttendanceCard userName={user?.name || ''} />
                            <RecentAttendance selectedDate={selectedDate} onDateChange={setSelectedDate} />
                        </div>
                        <div className="lg:col-span-1">{/* Bisa diisi komponen lain seperti statistik umum */}</div>
                    </div>
                </div>

                {/* Bagian Bawah: Daftar Kelas */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Daftar Kelas Anda</h3>
                        <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm">+ Tambah Kelas</button>
                    </div>
                    
                    {loading ? <p className="text-center text-gray-500 py-8">Memuat...</p> : (
                        daftarKelas.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {daftarKelas.map(cls => (
                                    <ClassCard 
                                        key={cls.id} 
                                        id={cls.id} 
                                        namaKelas={cls.namaKelas} 
                                        kodeKelas={cls.kodeKelas}
                                        onUpdate={() => openUpdateModal(cls)}
                                        onDelete={() => handleDeleteKelas(cls.id)}
                                    />
                                ))}
                            </div>
                        ) : <EmptyState onBuatKelas={() => setIsCreateModalOpen(true)} />
                    )}
                </div>
            </div>

            {/* Modal untuk BUAT KELAS BARU */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Buat Kelas Baru</h2>
                        <form onSubmit={handleTambahKelas}>
                            <label className="block text-sm font-medium text-gray-700">Nama Kelas</label>
                            <input
                                type="text"
                                value={namaKelasBaru}
                                onChange={(e) => setNamaKelasBaru(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                placeholder="Contoh: Pemrograman Web Lanjutan"
                                required
                            />
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Simpan Kelas</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL BARU UNTUK UPDATE KELAS */}
            {isUpdateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Update Nama Kelas</h2>
                        <form onSubmit={handleUpdateKelas}>
                            <label className="block text-sm font-medium text-gray-700">Nama Kelas</label>
                            <input
                                type="text"
                                value={updatedNamaKelas}
                                onChange={(e) => setUpdatedNamaKelas(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                required
                            />
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DosenDashboard;
