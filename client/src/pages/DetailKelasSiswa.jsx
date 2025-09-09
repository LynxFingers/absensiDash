import React, { useState, useEffect, useMemo, useCallback } from 'react';
// --- LANGKAH 1: Impor useNavigate ---
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, startOfWeek, addDays, subMonths, addMonths, addWeeks, subWeeks } from 'date-fns';
import { id } from 'date-fns/locale';

// Komponen Banner (tidak berubah)
const ClassDetailBanner = ({ className }) => (
    <div className="bg-blue-500 text-white p-6 rounded-lg shadow-md">
        <p className="text-sm font-semibold text-blue-100">Anda Terdaftar di Kelas</p>
        <h2 className="text-3xl font-bold">{className}</h2>
    </div>
);

// Komponen Kalender Riwayat (tidak berubah)
const RiwayatKehadiranSiswa = ({ riwayat, selectedDate, onDateChange, onWeekChange }) => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const getStatusColor = (status) => {
        if (!status) return 'bg-transparent';
        switch (status.toLowerCase()) {
            case 'hadir': return 'bg-green-500';
            case 'izin': return 'bg-yellow-500';
            case 'sakit': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };
    return (

        
        <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="text-lg font-bold text-gray-800">Riwayat Absensi</h3>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onWeekChange(-1)} className="p-1 rounded-full hover:bg-gray-200 text-gray-600">&lt;</button>
                    <span className="text-sm font-semibold w-28 text-center">{format(selectedDate, 'MMMM yyyy', { locale: id })}</span>
                    <button onClick={() => onWeekChange(1)} className="p-1 rounded-full hover:bg-gray-200 text-gray-600">&gt;</button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
                {days.map(day => {
                    const tanggalFormatted = format(day, 'yyyy-MM-dd');
                    const riwayatHariIni = riwayat.find(r => r.tanggal === tanggalFormatted);
                    const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    return (
                        <div key={day.toString()} onClick={() => onDateChange(day)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-blue-50'}`}>
                            <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>{format(day, 'E', { locale: id })}</p>
                            <p className="font-bold text-lg">{format(day, 'd')}</p>
                            <div className="h-2 flex justify-center items-center mt-1">
                                {riwayatHariIni && <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(riwayatHariIni.status)}`}></span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Komponen Utama Halaman Siswa
const DetailKelasSiswa = () => {
    const { id: kelasId } = useParams();
    // --- LANGKAH 2: Inisialisasi useNavigate ---
    const navigate = useNavigate();

    const [kelas, setKelas] = useState(null);
    const [semuaRiwayat, setSemuaRiwayat] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [isAbsenModalOpen, setIsAbsenModalOpen] = useState(false);
    const [statusUntukModal, setStatusUntukModal] = useState('hadir');
    
    const user = JSON.parse(localStorage.getItem('user'));

    const fetchInitialData = useCallback(async () => {
        if (!user?.id || !kelasId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [kelasRes, riwayatRes] = await Promise.all([
                axios.get(`http://localhost:3001/api/kelas/${kelasId}`),
                axios.get(`http://localhost:3001/api/kelas/${kelasId}/riwayat-siswa/${user.id}`)
            ]);
            setKelas(kelasRes.data);
            setSemuaRiwayat(riwayatRes.data);
        } catch (error) {
            console.error("Gagal memuat data awal:", error);
            setKelas(null);
        } finally {
            setLoading(false);
        }
    }, [kelasId, user?.id]);
    
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const dataUntukTanggalTerpilih = useMemo(() => {
        if (!semuaRiwayat) return null;
        const tanggalCari = format(selectedDate, 'yyyy-MM-dd');
        return semuaRiwayat.find(r => r.tanggal === tanggalCari);
    }, [selectedDate, semuaRiwayat]);

    const handleDoAbsensi = async () => {
        if (!dataUntukTanggalTerpilih || !user) return;
        setIsAbsenModalOpen(false);
        try {
            await axios.post('http://localhost:3001/api/absensi', {
                siswaId: user.id,
                sesiId: dataUntukTanggalTerpilih.sesiId,
                status: statusUntukModal
            });
            alert(`Absensi '${statusUntukModal}' berhasil direkam!`);
            fetchInitialData();
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal melakukan absensi.');
        }
    };

    // --- LANGKAH 3: Perbaiki fungsi handleLeaveClass ---
    const handleLeaveClass = async () => {
        if (window.confirm('Apakah Anda yakin ingin keluar dari kelas ini? Semua riwayat absensi Anda di kelas ini akan dihapus secara permanen.')) {
            try {
                await axios.delete(`http://localhost:3001/api/kelas/${kelasId}/leave`, {
                    data: { siswaId: user.id } // Kirim siswaId di dalam body untuk request DELETE
                });
                alert('Anda berhasil keluar dari kelas.');
                // Alihkan pengguna ke halaman dasbor siswa setelah berhasil
                navigate('/siswa'); 
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal keluar dari kelas.');
            }
        }
    };

    const handleWeekChange = (direction) => {
        setSelectedDate(current => direction === 1 ? addWeeks(current, 1) : subWeeks(current, 1));
    };
    
    const formatWaktu = (waktu) => new Date(waktu).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const renderDetailSection = () => {
        if (loading) return <p className="text-gray-500">Memuat...</p>;

        if (dataUntukTanggalTerpilih) {
            if (dataUntukTanggalTerpilih.status) {
                return <button disabled className="bg-gray-400 text-white font-bold py-3 px-6 text-base rounded-lg cursor-not-allowed">Anda Tercatat: {dataUntukTanggalTerpilih.status}</button>;
            }
            const isSesiActiveNow = new Date() >= new Date(dataUntukTanggalTerpilih.waktuSesiBuka) && new Date() <= new Date(dataUntukTanggalTerpilih.waktuSesiTutup) && dataUntukTanggalTerpilih.statusSesi === 'dibuka';
            if (isSesiActiveNow) {
                return (
                    <>
                        <p className="text-gray-600 mb-4">Sesi dibuka hingga: {formatWaktu(dataUntukTanggalTerpilih.waktuSesiTutup)}</p>
                        <button onClick={() => setIsAbsenModalOpen(true)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 text-base rounded-lg">Lakukan Absensi Sekarang</button>
                    </>
                );
            } else {
                 return <button disabled className="bg-gray-400 text-white font-bold py-3 px-6 text-base rounded-lg cursor-not-allowed">Sesi Tidak Aktif</button>;
            }
        }
        
        return <p className="text-gray-500">Tidak ada sesi absensi pada tanggal ini.</p>;
    };

    if (loading && !kelas) return <div className="h-screen flex justify-center items-center font-bold text-xl">Memuat...</div>;
    if (!kelas) return <div className="h-screen flex justify-center items-center font-bold text-xl text-red-500">Kelas tidak ditemukan.</div>;

    return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
            
            <div className="bg-gray-100 rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-7xl mx-auto">
                    
                   <div className="flex justify-between items-center mb-6">
    
    {/* Link "Kembali ke Dasbor" di sebelah kiri */}
    <Link to="/siswa" className="text-sm font-semibold text-blue-600 hover:underline">
        &larr; Kembali ke Dasbor
    </Link>
    
    {/* Tombol "Keluar Kelas" di sebelah kanan */}
    <button
        onClick={handleLeaveClass}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 text-sm rounded-lg transition-colors duration-200"
        title="Keluar dari kelas ini"
    >
        Keluar Kelas
    </button>
</div>
                    
                    <ClassDetailBanner className={kelas.namaKelas} />
                    
                    <div className="mt-8">
                        <RiwayatKehadiranSiswa riwayat={semuaRiwayat} selectedDate={selectedDate} onDateChange={setSelectedDate} onWeekChange={handleWeekChange}/>
                    </div>
                </div>

                <div className="mt-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-7xl mx-auto">
                        <h3 className="text-xl font-bold text-gray-800">Detail & Absensi - {format(selectedDate, 'd MMMM yyyy', { locale: id })}</h3>
                        <div className="mt-4 p-6 bg-gray-50 rounded-lg min-h-[15rem] flex flex-col items-center justify-center text-center">
                            {renderDetailSection()}
                        </div>
                    </div>
                </div>

                {/* --- LANGKAH 4: Tambahkan Bagian Pengaturan & Tombol Keluar Kelas --- */}
                
            </div>
            
            {isAbsenModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                   <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
                       <h2 className="text-2xl font-bold mb-6 text-center">Pilih Status Kehadiran</h2>
                       <div className="space-y-4">
                           <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                               <input type="radio" name="status" value="hadir" checked={statusUntukModal === 'hadir'} onChange={() => setStatusUntukModal('hadir')} className="h-5 w-5 text-green-600" />
                               <span className="ml-4 text-lg font-medium">Hadir</span>
                           </label>
                           <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                               <input type="radio" name="status" value="izin" checked={statusUntukModal === 'izin'} onChange={() => setStatusUntukModal('izin')} className="h-5 w-5 text-yellow-600" />
                               <span className="ml-4 text-lg font-medium">Izin</span>
                           </label>
                           <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                               <input type="radio" name="status" value="sakit" checked={statusUntukModal === 'sakit'} onChange={() => setStatusUntukModal('sakit')} className="h-5 w-5 text-red-600" />
                               <span className="ml-4 text-lg font-medium">Sakit</span>
                           </label>
                       </div>
                       <div className="mt-8 flex space-x-3">
                           <button type="button" onClick={() => setIsAbsenModalOpen(false)} className="w-full px-4 py-2 bg-gray-200 rounded-md">Batal</button>
                           <button type="button" onClick={handleDoAbsensi} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md">Konfirmasi</button>
                       </div>
                   </div>
                </div>
            )}
        </div>
    );
};

export default DetailKelasSiswa;