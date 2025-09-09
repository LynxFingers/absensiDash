import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';

// =================================================================
// KOMPONEN-KOMPONEN UI
// =================================================================

// --- Komponen Header Fungsional (dari Kode 1) ---
const HeaderDetail = ({ onBuatAbsensiClick, onUpdateClick, onDeleteClick }) => (
    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
            <Link to="/dosen" className="text-sm font-semibold text-blue-600 hover:underline mb-2 inline-block">
                &larr; Kembali ke Dasbor
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Manajemen Kelas</h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
            <button onClick={onBuatAbsensiClick} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm">
                + Buat Sesi
            </button>
            <button onClick={onUpdateClick} className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm text-sm">
                Update
            </button>
            <button onClick={onDeleteClick} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm">
                Hapus
            </button>
        </div>
    </div>
);

// --- Komponen Banner Detail Kelas (dari Kode 1, lebih simpel) ---
const ClassDetailBanner = ({ className }) => (
    <div className="bg-orange-500 text-white p-6 rounded-lg shadow-md flex justify-between items-center">
        <div>
            <p className="text-sm font-semibold text-orange-100">Kelas</p>
            <h2 className="text-3xl font-bold">{className}</h2>
        </div>
    </div>
);

// --- Komponen StatCard (diambil dari Kode 2) ---
const StatCard = ({ label, value, color }) => {
    const colorVariants = {
        green: 'bg-green-500 text-white',
        yellow: 'bg-yellow-500 text-white',
        red: 'bg-red-500 text-white',
        blue: 'bg-blue-500 text-white',
    };
    return (
        <div className={`p-4 rounded-lg shadow-sm ${colorVariants[color]}`}>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
};


// --- Komponen Kalender Mingguan (diambil dari Kode 2) ---
const WeeklyCalendar = ({ weekData, selectedDate, onDateChange, onWeekChange }) => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Riwayat Absensi</h3>
                    <p className="text-sm text-gray-500">{format(weekDates[0], 'd MMM', { locale: id })} - {format(weekDates[6], 'd MMM yyyy', { locale:id })}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onWeekChange(-1)} className="p-1.5 rounded-md hover:bg-gray-200 transition-colors" aria-label="Minggu Sebelumnya">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="font-semibold text-sm text-gray-700 w-28 text-center">
                        {format(selectedDate, 'MMMM yyyy', { locale: id })}
                    </span>
                    <button onClick={() => onWeekChange(1)} className="p-1.5 rounded-md hover:bg-gray-200 transition-colors" aria-label="Minggu Selanjutnya">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
                {weekDates.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const hasSession = weekData[format(date, 'yyyy-MM-dd')];
                    return (
                        <div key={index} onClick={() => onDateChange(date)}
                            className={`flex-grow text-center p-2 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}>
                            <p className={`text-xs font-bold mb-1 ${isSelected ? 'text-red-100' : 'text-gray-500'}`}>{dayNames[index]}</p>
                            <p className="font-bold text-lg">{format(date, 'd')}</p>
                            <div className="h-2 flex justify-center items-center mt-1">
                                {hasSession && <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// =================================================================
// KOMPONEN UTAMA HALAMAN DETAIL KELAS (GABUNGAN)
// =================================================================
const DetailKelasPage = () => {
    const { id: kelasId } = useParams();
    const navigate = useNavigate();

    // --- STATE MANAGEMENT ---
    const [kelas, setKelas] = useState(null);
    const [weekData, setWeekData] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // --- State untuk Modals ---
    const [isBuatSesiModalOpen, setIsBuatSesiModalOpen] = useState(false);
    const [isUpdateKelasModalOpen, setIsUpdateKelasModalOpen] = useState(false);
    
    // State untuk form Buat Sesi
    const [waktuBuka, setWaktuBuka] = useState(new Date());
    const [waktuTutup, setWaktuTutup] = useState(new Date(new Date().getTime() + 3600000)); // Default 1 jam dari sekarang
    
    // State untuk form Update Kelas
    const [namaKelasUpdate, setNamaKelasUpdate] = useState("");

    const sessionTimeoutIdRef = useRef(null);

    // --- LOGIKA PENGAMBILAN DATA (Diadaptasi dari Kode 2 yang lebih efisien) ---
    const fetchAllData = useCallback(async () => {
        if (!kelasId) return;
        setLoading(true);

        try {
            // 1. Ambil data kelas (jika belum ada)
            const localKelasData = kelas || (await axios.get(`http://localhost:3001/api/kelas/${kelasId}`)).data;
            if (!kelas) setKelas(localKelasData);

            // 2. Siapkan tanggal untuk satu minggu
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const datesToFetch = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));

            // 3. Ambil semua data sesi untuk minggu tersebut secara paralel
            const sessionPromises = datesToFetch.map(tanggalAPI =>
                axios.get(`http://localhost:3001/api/kelas/${kelasId}/sesi-by-tanggal?tanggal=${tanggalAPI}`)
                    .then(response => ({ tanggal: tanggalAPI, sesi: response.data }))
                    .catch(() => ({ tanggal: tanggalAPI, sesi: null }))
            );
            
            const sessionResults = await Promise.all(sessionPromises);
            const newWeekData = {};
            const detailPromises = [];

            // 4. Untuk setiap sesi yang ada, ambil statistik dan laporan kehadiran
            for (const result of sessionResults) {
                if (result.sesi) {
                    detailPromises.push(
                        Promise.all([
                            axios.get(`http://localhost:3001/api/kelas/${kelasId}/statistik?tanggal=${result.tanggal}`),
                            axios.get(`http://localhost:3001/api/sesi-absensi/${result.sesi.id}/laporan`)
                        ]).then(([statsRes, reportRes]) => {
                            const daftarSiswaLengkap = localKelasData.daftarSiswa.map(siswa => {
                                const absensiSiswa = reportRes.data.find(absen => absen.userId == siswa.id);
                                return { ...siswa, status: absensiSiswa ? absensiSiswa.status : 'Belum Absen' };
                            });
                            newWeekData[result.tanggal] = {
                                sesi: result.sesi,
                                statistik: statsRes.data,
                                laporan: daftarSiswaLengkap
                            };
                        })
                    );
                } else {
                    newWeekData[result.tanggal] = null;
                }
            }

            await Promise.all(detailPromises);
            setWeekData(newWeekData);

        } catch (error) {
            console.error("Gagal memuat data detail kelas:", error);
            setKelas(null); // Jika kelas tidak ditemukan, set ke null
        } finally {
            setLoading(false);
        }
    }, [kelasId, selectedDate, kelas]); // dependensi 'kelas' untuk memastikan data siswa ada
    
    useEffect(() => {
        fetchAllData();
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kelasId, selectedDate]); // Hanya fetch ulang saat ID kelas atau tanggal yang dipilih berubah

    // --- Timer untuk auto-refresh saat sesi berakhir (dari Kode 2) ---
    useEffect(() => {
        if (sessionTimeoutIdRef.current) clearTimeout(sessionTimeoutIdRef.current);
        
        const todayString = format(new Date(), 'yyyy-MM-dd');
        const sessionDataForToday = weekData[todayString];
        
        if (sessionDataForToday && sessionDataForToday.sesi.status === 'dibuka') {
            const closingTime = new Date(sessionDataForToday.sesi.waktuTutup);
            const msUntilEnd = closingTime.getTime() - new Date().getTime();
            
            if (msUntilEnd > 0) {
                sessionTimeoutIdRef.current = setTimeout(() => {
                    fetchAllData();
                }, msUntilEnd + 1000); // Tambah 1 detik buffer
            }
        }
        
        return () => {
            if (sessionTimeoutIdRef.current) clearTimeout(sessionTimeoutIdRef.current);
        };
    }, [weekData, fetchAllData]);


    // --- HANDLERS ---
    const handleWeekChange = (direction) => {
        setSelectedDate(current => addDays(current, 7 * direction));
    };

    const handleBukaSesi = async (e) => {
        e.preventDefault();
        const formattedWaktuBuka = format(waktuBuka, 'yyyy-MM-dd HH:mm:ss');
        const formattedWaktuTutup = format(waktuTutup, 'yyyy-MM-dd HH:mm:ss');

        try {
            await axios.post('http://localhost:3001/api/sesi-absensi', {
                kelasId,
                waktuBuka: formattedWaktuBuka,
                waktuTutup: formattedWaktuTutup
            });
            alert('Sesi absensi berhasil dibuka.');
            setIsBuatSesiModalOpen(false);
            await fetchAllData();
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal membuka sesi.');
        }
    };

    // --- Fungsi untuk tutup sesi manual (dari Kode 2) ---
    const handleTutupSesi = async () => {
        const sesiId = selectedDayData?.sesi?.id;
        if (!sesiId) return;

        if (window.confirm('Apakah Anda yakin ingin menutup sesi ini secara manual?')) {
            try {
                await axios.post(`http://localhost:3001/api/sesi-absensi/${sesiId}/tutup`);
                alert('Sesi berhasil ditutup.');
                await fetchAllData();
            } catch (error) {
                alert('Gagal menutup sesi.');
            }
        }
    };

    // --- Fungsi untuk Update dan Delete (dari Kode 1) ---
    const openUpdateModal = () => {
        if (!kelas) return;
        setNamaKelasUpdate(kelas.namaKelas);
        setIsUpdateKelasModalOpen(true);
    };

    const handleUpdateKelas = async (e) => {
        e.preventDefault();
        if (!namaKelasUpdate.trim()) return alert("Nama kelas tidak boleh kosong.");
        try {
            const response = await axios.put(`http://localhost:3001/api/kelas/${kelasId}`, { namaKelas: namaKelasUpdate });
            alert('Nama kelas berhasil diperbarui!');
            setKelas(response.data); // Update state lokal
            setIsUpdateKelasModalOpen(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal memperbarui kelas.');
        }
    };

    const handleDeleteKelas = async () => {
        if (window.confirm(`Yakin ingin menghapus kelas "${kelas?.namaKelas}"? Semua data terkait (sesi dan absensi) akan dihapus permanen.`)) {
            try {
                await axios.delete(`http://localhost:3001/api/kelas/${kelasId}`);
                alert('Kelas berhasil dihapus.');
                navigate('/dosen'); // Redirect ke dasbor
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal menghapus kelas.');
            }
        }
    };

    // --- DATA YANG DI-MEMOIZE (dari Kode 2) ---
    const selectedDayData = useMemo(() => {
        return weekData[format(selectedDate, 'yyyy-MM-dd')] || null;
    }, [weekData, selectedDate]);
    
    const displayStats = useMemo(() => {
        const totalSiswa = kelas?.jumlahSiswa || 0;
        if (!selectedDayData || !selectedDayData.sesi) {
            return { hadir: 0, izinSakit: 0, tanpaKeterangan: 0, total: totalSiswa };
        }
        const stats = selectedDayData.statistik || {};
        const hadir = stats.hadir || 0;
        const izin = stats.izin || 0;
        const sakit = stats.sakit || 0;
        let tanpaKeterangan;

        if (selectedDayData.sesi.status === 'ditutup') {
            tanpaKeterangan = totalSiswa - (hadir + izin + sakit);
        } else {
            tanpaKeterangan = stats.tanpaKeterangan || 0;
        }
        return { hadir, izinSakit: izin + sakit, tanpaKeterangan, total: totalSiswa };
    }, [selectedDayData, kelas]);

    const isSesiActiveNow = selectedDayData?.sesi?.status === 'dibuka' && new Date(selectedDayData.sesi.waktuTutup) > new Date();

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'hadir': return 'bg-green-100 text-green-800';
            case 'sakit': return 'bg-red-100 text-red-800';
            case 'izin': return 'bg-yellow-100 text-yellow-800';
            case 'tanpa keterangan': return 'bg-gray-400 text-white';
            default: return 'bg-gray-200 text-gray-600';
        }
    };

    // --- RENDER LOGIC ---
    if (loading && !kelas) return <div className="h-screen flex justify-center items-center font-bold text-xl">Memuat...</div>;
    if (!kelas) return <div className="h-screen flex justify-center items-center font-bold text-xl text-red-500">Kelas tidak ditemukan atau gagal dimuat.</div>;

    return (
        <div className="w-full bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-7xl mx-auto space-y-8">
                
                <HeaderDetail
                    onBuatAbsensiClick={() => setIsBuatSesiModalOpen(true)}
                    onUpdateClick={openUpdateModal}
                    onDeleteClick={handleDeleteKelas}
                />
                
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <ClassDetailBanner className={kelas.namaKelas} />
                            <WeeklyCalendar weekData={weekData} selectedDate={selectedDate} onDateChange={setSelectedDate} onWeekChange={handleWeekChange} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 lg:col-span-1 content-start">
                             <StatCard label="Hadir" value={displayStats.hadir} color="green" />
                             <StatCard label="Izin & Sakit" value={displayStats.izinSakit} color="yellow" />
                             <StatCard label="Tanpa Keterangan" value={displayStats.tanpaKeterangan < 0 ? 0 : displayStats.tanpaKeterangan} color="red" />
                             <StatCard label="Total Siswa" value={displayStats.total} color="blue" />
                        </div>
                    </div>
                </div>

                {/* --- Laporan Kehadiran (diambil dari Kode 2) --- */}
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Laporan Kehadiran - {format(selectedDate, 'd MMMM yyyy', { locale: id })}</h3>
                        {isSesiActiveNow && (
                            <button onClick={handleTutupSesi} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                                Tutup Sesi Sekarang
                            </button>
                        )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6 min-h-[10rem] flex items-center justify-center">
                        {loading ? <p className="text-gray-500">Memuat laporan...</p> : (
                            selectedDayData?.laporan?.length > 0 ? (
                                <ul className="space-y-3 w-full">
                                    {selectedDayData.laporan.map(item => (
                                        <li key={item.id} className="flex justify-between items-center p-3 rounded-md hover:bg-gray-100">
                                            <span className="font-semibold text-gray-800">{item.name}</span>
                                            <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">{isSameDay(selectedDate, new Date()) ? "Belum ada sesi absensi untuk hari ini." : "Tidak ada sesi absensi pada tanggal ini."}</p>
                            )
                        )}
                    </div>
                </div>
            </div>
            
            {/* --- Modals (digabungkan) --- */}
            {isBuatSesiModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Buka Sesi Absensi</h2>
                        <form onSubmit={handleBukaSesi}>
                             <div className="space-y-4">
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700">Waktu Buka</label>
                                     <DatePicker selected={waktuBuka} onChange={(date) => setWaktuBuka(date)} showTimeSelect dateFormat="Pp" locale={id} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700">Waktu Tutup</label>
                                     <DatePicker selected={waktuTutup} onChange={(date) => setWaktuTutup(date)} showTimeSelect dateFormat="Pp" locale={id} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                                 </div>
                             </div>
                             <div className="mt-6 flex justify-end space-x-3">
                                 <button type="button" onClick={() => setIsBuatSesiModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                                 <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Konfirmasi & Buka Sesi</button>
                             </div>
                        </form>
                    </div>
                </div>
            )}

            {isUpdateKelasModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Update Nama Kelas</h2>
                        <form onSubmit={handleUpdateKelas}>
                            <label className="block text-sm font-medium text-gray-700">Nama Kelas</label>
                            <input
                                type="text"
                                value={namaKelasUpdate}
                                onChange={(e) => setNamaKelasUpdate(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                required
                            />
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsUpdateKelasModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Simpan Perubahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailKelasPage;