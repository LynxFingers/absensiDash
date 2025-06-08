// =================================================================
// 1. IMPOR PACKAGE
// =================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// =================================================================
// 2. INISIALISASI & KONEKSI
// =================================================================
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Koneksi Database
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    timezone: '+07:00'
  }
);

// =================================================================
// 3. DEFINISI SEMUA MODEL
// =================================================================
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('siswa', 'dosen'), allowNull: false }
});

const Kelas = sequelize.define('Kelas', {
  namaKelas: { type: DataTypes.STRING, allowNull: false },
  kodeKelas: { type: DataTypes.STRING, allowNull: false, unique: true }
});

const SesiAbsensi = sequelize.define('SesiAbsensi', {
    // MENGGUNAKAN DATETIME UNTUK MENYIMPAN TANGGAL & WAKTU SEKALIGUS
    waktuBuka: { type: DataTypes.DATE, allowNull: false },
    waktuTutup: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM('dibuka', 'ditutup'), defaultValue: 'dibuka' }
});

const Absensi = sequelize.define('Absensi', {
  waktuAbsen: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('hadir', 'izin', 'sakit', 'tanpa keterangan'), allowNull: false }
});

// =================================================================
// 4. DEFINISI SEMUA ASOSIASI (HUBUNGAN ANTAR MODEL)
// =================================================================
const KelasSiswa = sequelize.define('KelasSiswa', {}, { timestamps: false });

User.hasMany(Kelas, { foreignKey: 'dosenId', as: 'kelasYangDiajar' }); 
Kelas.belongsTo(User, { as: 'dosen', foreignKey: 'dosenId' });

User.belongsToMany(Kelas, { as: 'kelasDiikuti', through: KelasSiswa, foreignKey: 'userId' });
Kelas.belongsToMany(User, { as: 'siswa', through: KelasSiswa, foreignKey: 'kelasId' });

Kelas.hasMany(SesiAbsensi, { foreignKey: 'kelasId' });
SesiAbsensi.belongsTo(Kelas, { foreignKey: 'kelasId' });

SesiAbsensi.hasMany(Absensi, { foreignKey: 'sesiId' });
Absensi.belongsTo(SesiAbsensi, { foreignKey: 'sesiId' });

User.hasMany(Absensi, { foreignKey: 'userId' });
Absensi.belongsTo(User, { as: 'siswaAbsen', foreignKey: 'userId' });


// =================================================================
// FUNGSI HELPER BARU UNTUK MENUTUP SESI KEDALUWARSA
// =================================================================
const autoCloseExpiredSessions = async (kelasId) => {
    try {
        const sekarang = new Date();
        // Cari semua sesi di kelas ini yang statusnya 'dibuka' dan waktu tutupnya sudah lewat
        const expiredSessions = await SesiAbsensi.findAll({
            where: {
                kelasId: kelasId,
                status: 'dibuka',
                waktuTutup: { [Sequelize.Op.lt]: sekarang } // waktuTutup < waktu sekarang
            }
        });

        // Jika tidak ada sesi yang kedaluwarsa, tidak perlu lakukan apa-apa
        if (expiredSessions.length === 0) {
            return;
        }

        console.log(`Menemukan ${expiredSessions.length} sesi kedaluwarsa, memulai proses penutupan...`);

        // Lakukan proses penutupan untuk setiap sesi yang kedaluwarsa
        for (const sesi of expiredSessions) {
            const kelas = await Kelas.findByPk(sesi.kelasId, {
                include: { model: User, as: 'siswa', attributes: ['id'] }
            });
            if (!kelas) continue;

            const semuaSiswaIds = kelas.siswa.map(s => s.id);
            const sudahAbsenRes = await Absensi.findAll({ where: { sesiId: sesi.id }, attributes: ['userId'] });
            const sudahAbsenIds = sudahAbsenRes.map(a => a.userId);
            const belumAbsenIds = semuaSiswaIds.filter(id => !sudahAbsenIds.includes(id));

            if (belumAbsenIds.length > 0) {
                const rekamanAbsenBaru = belumAbsenIds.map(siswaId => ({
                    waktuAbsen: new Date(),
                    status: 'tanpa keterangan',
                    userId: siswaId,
                    sesiId: sesi.id
                }));
                await Absensi.bulkCreate(rekamanAbsenBaru);
            }

            // Update status sesi menjadi 'ditutup'
            sesi.status = 'ditutup';
            await sesi.save();
            console.log(`Sesi ID ${sesi.id} berhasil ditutup. ${belumAbsenIds.length} siswa ditandai 'tanpa keterangan'.`);
        }
    } catch (error) {
        console.error("AUTO-CLOSE SESSIONS ERROR:", error);
        // Kita tidak melempar error agar proses utama tetap berjalan
    }
};
// =================================================================
// 5. DEFINISI SEMUA ENDPOINT API
// =================================================================

// --- ENDPOINTS UNTUK OTENTIKASI ---
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, role });
    res.status(201).json({ message: 'User berhasil dibuat', userId: newUser.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal membuat user', error: error.message });
  }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) { return res.status(404).json({ message: 'User tidak ditemukan.' }); }
        const isPasswordMatch = bcrypt.compareSync(password, user.password);
        if (!isPasswordMatch) { return res.status(401).json({ message: 'Password salah.' }); }
        if (user.role !== role) { return res.status(401).json({ message: 'Peran (role) tidak sesuai.' }); }
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

// --- ENDPOINTS UNTUK KELAS ---
app.post('/api/kelas', async (req, res) => {
    const { namaKelas, dosenId } = req.body;
    try {
        if (!namaKelas || !dosenId) { return res.status(400).json({ message: 'Nama kelas dan ID Dosen wajib diisi.' }); }
        const kodeKelas = Math.random().toString(36).substring(2, 7).toUpperCase();
        const kelasBaru = await Kelas.create({ namaKelas, kodeKelas, dosenId });
        res.status(201).json(kelasBaru);
    } catch (error) {
        console.error("CREATE CLASS ERROR:", error);
        res.status(500).json({ message: 'Gagal membuat kelas', error: error.message });
    }
});

app.get('/api/kelas', async (req, res) => {
    const { dosenId } = req.query; 
    try {
        if (!dosenId) { return res.status(400).json({ message: 'dosenId query parameter is required' }); }
        const daftarKelas = await Kelas.findAll({ where: { dosenId: dosenId } });
        res.json(daftarKelas);
    } catch (error) {
        console.error("GET KELAS LIST ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil data kelas' });
    }
});

app.get('/api/kelas/:id', async (req, res) => {
    try {
        const kelasId = req.params.id;
        const kelas = await Kelas.findByPk(kelasId, {
            include: { model: User, as: 'siswa', attributes: ['id', 'name', 'email'] }
        });
        if (!kelas) { return res.status(404).json({ message: 'Kelas tidak ditemukan' }); }
        const responseData = {
            id: kelas.id,
            namaKelas: kelas.namaKelas,
            kodeKelas: kelas.kodeKelas,
            dosenId: kelas.dosenId,
            jumlahSiswa: kelas.siswa.length,
            daftarSiswa: kelas.siswa
        };
        res.json(responseData);
    } catch (error) {
        console.error("GET DETAIL KELAS ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil data detail kelas' });
    }
});

// Endpoint untuk SISWA BERGABUNG ke kelas pakai kode
app.post('/api/kelas/join', async (req, res) => {
    try {
        const { kodeKelas, siswaId } = req.body;
        if (!kodeKelas || !siswaId) {
            return res.status(400).json({ message: 'Kode kelas dan ID Siswa wajib diisi.' });
        }

        const kelas = await Kelas.findOne({ where: { kodeKelas } });
        if (!kelas) {
            return res.status(404).json({ message: 'Kelas dengan kode tersebut tidak ditemukan.' });
        }

        const siswa = await User.findByPk(siswaId);
        if (!siswa || siswa.role !== 'siswa') {
            return res.status(404).json({ message: 'User siswa tidak ditemukan.' });
        }
        
        const isEnrolled = await kelas.hasSiswa(siswa);
        if (isEnrolled) {
            return res.status(409).json({ message: 'Anda sudah terdaftar di kelas ini.' });
        }

        await kelas.addSiswa(siswa);

        res.status(200).json({ message: `Siswa ${siswa.name} berhasil bergabung ke kelas ${kelas.namaKelas}` });
    } catch (error) {
        console.error("JOIN KELAS ERROR:", error);
        res.status(500).json({ message: 'Gagal bergabung ke kelas' });
    }
});

// --- [INI ENDPOINT YANG BARU DITAMBAHKAN UNTUK MEMPERBAIKI ERROR 404] ---
// Endpoint untuk MELIHAT KELAS YANG DIIKUTI SISWA
app.get('/api/students/:studentId/classes', async (req, res) => {
    try {
        const { studentId } = req.params;

        // Query manual untuk mencari semua kelas yang terhubung dengan studentId
        const enrolledClasses = await Kelas.findAll({
            include: [{
                model: User,
                as: 'siswa', // Menggunakan alias dari definisi hubungan Kelas -> User
                where: { id: studentId },
                attributes: [] // Kita tidak butuh data user di sini, hanya untuk filtering
            }],
            attributes: ['id', 'namaKelas', 'kodeKelas'] // Ambil data kelas yang diperlukan
        });
        
        if (!enrolledClasses) {
            return res.status(404).json({ message: 'Siswa ini belum terdaftar di kelas manapun.' });
        }
        
        res.status(200).json(enrolledClasses);

    } catch (error) {
        console.error("GET ENROLLED CLASSES ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil data kelas siswa' });
    }
});


// --- ENDPOINTS UNTUK STATISTIK & LAPORAN ---
// --- [PERBAIKAN KONSISTENSI] Endpoint Statistik disamakan dengan logika Laporan ---
// GANTI ENDPOINT STATISTIK INI DI server.js
app.get('/api/kelas/:id/statistik', async (req, res) => {
    try {
        const kelasId = req.params.id;
        const { tanggal } = req.query;

        if (!tanggal) {
            return res.status(400).json({ message: 'Query tanggal wajib diisi.' });
        }

        // Panggil fungsi auto-close yang sudah kita buat
        await autoCloseExpiredSessions(kelasId);

        // DISAMAKAN: Cari sesi yang DIMULAI persis pada tanggal ini
        const sesi = await SesiAbsensi.findOne({
            where: {
                kelasId: kelasId,
                waktuBuka: {
                    [Sequelize.Op.between]: [`${tanggal} 00:00:00`, `${tanggal} 23:59:59`]
                }
            }
        });

        if (!sesi) {
            return res.json({ hadir: 0, izin: 0, sakit: 0, tanpaKeterangan: 0 });
        }

        const statistik = await Absensi.findAll({ where: { sesiId: sesi.id }, attributes: [ 'status', [sequelize.fn('COUNT', sequelize.col('status')), 'jumlah']], group: ['status'] });
        const hasilFormatted = { hadir: 0, izin: 0, sakit: 0, tanpaKeterangan: 0 };
        statistik.forEach(item => {
            const statusKey = item.status.replace(' ', '');
            const finalKey = statusKey === 'tanpaketerangan' ? 'tanpaKeterangan' : statusKey;
            hasilFormatted[finalKey] = item.get('jumlah');
        });
        res.json(hasilFormatted);
    } catch (error) {
        console.error("GET STATISTIK ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil data statistik' });
    }
});

// GANTI ENDPOINT RIWAYAT SISWA INI DI server.js
// --- [REVISI FINAL] Endpoint Riwayat Siswa yang Lebih Lengkap ---
app.get('/api/kelas/:kelasId/riwayat-siswa/:siswaId', async (req, res) => {
    try {
        const { kelasId, siswaId } = req.params;
        await autoCloseExpiredSessions(kelasId); // Pastikan sesi kedaluwarsa sudah ditutup

        // 1. Ambil SEMUA sesi yang ada untuk kelas ini
        const semuaSesi = await SesiAbsensi.findAll({
            where: { kelasId: kelasId },
            order: [['waktuBuka', 'ASC']]
        });

        if (semuaSesi.length === 0) {
            return res.json([]); // Jika tidak ada sesi sama sekali, kembalikan array kosong
        }

        // 2. Ambil SEMUA rekaman absen siswa untuk sesi-sesi tersebut
        const semuaAbsenSiswa = await Absensi.findAll({
            where: {
                userId: siswaId,
                sesiId: { [Sequelize.Op.in]: semuaSesi.map(s => s.id) }
            }
        });

        // 3. Gabungkan kedua data tersebut
        const riwayatLengkap = semuaSesi.map(sesi => {
            const absensiUntukSesiIni = semuaAbsenSiswa.find(a => a.sesiId === sesi.id);
            
            return {
                sesiId: sesi.id,
                // Tanggal riwayat kita standarkan berdasarkan tanggal sesi dibuka
                tanggal: new Date(sesi.waktuBuka).toISOString().split('T')[0],
                // Status siswa: 'hadir', 'sakit', atau null jika belum absen
                status: absensiUntukSesiIni ? absensiUntukSesiIni.status : null,
                waktuAbsen: absensiUntukSesiIni ? absensiUntukSesiIni.waktuAbsen : null,
                waktuSesiBuka: sesi.waktuBuka,
                waktuSesiTutup: sesi.waktuTutup,
                statusSesi: sesi.status // 'dibuka' atau 'ditutup'
            };
        });

        res.json(riwayatLengkap);

    } catch (error) {
        console.error("GET RIWAYAT SISWA ERROR (FINAL):", error);
        res.status(500).json({ message: 'Gagal mengambil data riwayat' });
    }
});

// PERBAIKAN KEDUA: Tambahkan `id` sesi ke riwayat siswa agar bisa absen
// --- [PERBAIKAN FINAL] Endpoint untuk RIWAYAT ABSENSI SISWA ---
// --- [PERBAIKAN FINAL] Endpoint untuk RIWAYAT ABSENSI SISWA ---
app.get('/api/kelas/:kelasId/riwayat-siswa/:siswaId', async (req, res) => {
    try {
        const { kelasId, siswaId } = req.params;

        const riwayat = await Absensi.findAll({
            where: {
                userId: siswaId,
            },
            include: [{
                model: SesiAbsensi,
                where: { kelasId: kelasId },
                // PERBAIKAN: Hapus 'tanggal' dari attributes karena sudah tidak ada
                attributes: ['id', 'waktuBuka', 'waktuTutup', 'status'], 
                required: true
            }],
            attributes: ['status', 'waktuAbsen'],
            order: [[SesiAbsensi, 'waktuBuka', 'ASC']]
        });

        // Format data agar mudah digunakan di frontend
        const riwayatFormatted = riwayat.map(item => ({
            sesiId: item.SesiAbsensi.id,
            // Gunakan fungsi JavaScript bawaan untuk format tanggal dari waktuBuka
            tanggal: new Date(item.SesiAbsensi.waktuBuka).toISOString().split('T')[0],
            status: item.status,
            waktuAbsen: item.waktuAbsen,
            waktuSesiBuka: item.SesiAbsensi.waktuBuka,
            waktuSesiTutup: item.SesiAbsensi.waktuTutup,
            statusSesi: item.SesiAbsensi.status
        }));

        res.json(riwayatFormatted);

    } catch (error) {
        console.error("GET RIWAYAT SISWA ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil data riwayat' });
    }
});

app.get('/api/kelas/:id/absensi', async (req, res) => {
    try {
        const { tanggal, status } = req.query;
        if (!tanggal || !status) {
            return res.status(400).json({ message: 'Query tanggal dan status wajib diisi.' });
        }

        const hasilAbsensi = await Absensi.findAll({
            where: { status: status },
            include: [
                { model: User, as: 'siswaAbsen', attributes: ['id', 'name', 'email'], required: true },
                {
                    model: SesiAbsensi,
                    where: { tanggal: tanggal, kelasId: req.params.id },
                    attributes: [],
                    required: true
                }
            ]
        });

        const daftarSiswa = hasilAbsensi.map(item => item.siswaAbsen);
        
        res.json(daftarSiswa);

    } catch (error) {
        console.error("GET LAPORAN ABSENSI ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil laporan absensi' });
    }
});

// --- ENDPOINT UNTUK SESI ABSENSI ---
app.post('/api/sesi-absensi', async (req, res) => {
    try {
        // Terima waktuBuka dan waktuTutup
        const { kelasId, waktuBuka, waktuTutup } = req.body;

        // Validasi sederhana
        if (new Date(waktuTutup) <= new Date(waktuBuka)) {
            return res.status(400).json({ message: 'Waktu tutup harus setelah waktu buka.' });
        }

        const sesiBaru = await SesiAbsensi.create({ kelasId, waktuBuka, waktuTutup });
        res.status(201).json({ message: 'Sesi absensi berhasil dibuat.', sesi: sesiBaru });

    } catch (error) {
        console.error("CREATE SESI ERROR:", error);
        res.status(500).json({ message: 'Gagal membuka sesi absensi' });
    }
});



// --- [PERBAIKAN SESUAI PERMINTAAN] Endpoint hanya mencari sesi berdasarkan tanggal mulai ---
// --- [PERBAIKAN FINAL] Endpoint hanya mencari sesi berdasarkan tanggal mulai ---
app.get('/api/kelas/:kelasId/sesi-by-tanggal', async (req, res) => {
    try {
        const { kelasId } = req.params;
        const { tanggal } = req.query;

        if (!tanggal) {
            return res.status(400).json({ message: 'Query parameter `tanggal` wajib diisi.' });
        }

        // Panggil auto-close sebelum mengambil data
        await autoCloseExpiredSessions(kelasId);

        // PERBAIKAN: Gunakan 'Op.between' untuk pencarian tanggal yang lebih andal
        const sesi = await SesiAbsensi.findOne({
            where: {
                kelasId: kelasId,
                waktuBuka: {
                    [Sequelize.Op.between]: [`${tanggal} 00:00:00`, `${tanggal} 23:59:59`]
                }
            }
        });

        if (!sesi) {
            return res.status(404).json({ message: `Tidak ada sesi yang dimulai pada tanggal ${tanggal}.` });
        }
        res.json(sesi);
    } catch (error) {
        console.error("CEK SESI BY TANGGAL ERROR:", error);
        res.status(500).json({ message: 'Gagal mengecek sesi absensi' });
    }
});

// --- [ENDPOINT BARU] KHUSUS UNTUK SISWA MENCARI SESI AKTIF ---
app.get('/api/kelas/:kelasId/sesi-aktif', async (req, res) => {
    try {
        const { kelasId } = req.params;
        const { siswaId } = req.query;

        if (!siswaId) {
            return res.status(400).json({ message: 'Query parameter `siswaId` wajib diisi.' });
        }

        // Panggil auto-close sebelum mengambil data
        await autoCloseExpiredSessions(kelasId);

        const sekarang = new Date();
        const sesiAktif = await SesiAbsensi.findOne({
            where: {
                kelasId: kelasId,
                status: 'dibuka',
                waktuBuka: { [Sequelize.Op.lte]: sekarang },
                waktuTutup: { [Sequelize.Op.gte]: sekarang }
            }
        });

        if (!sesiAktif) {
            return res.status(404).json({ message: 'Saat ini tidak ada sesi absensi yang aktif.' });
        }

        // Jika sesi aktif ditemukan, cek apakah siswa ini sudah absen
        const absensiSiswa = await Absensi.findOne({ where: { userId: siswaId, sesiId: sesiAktif.id } });
        
        // Kirim semua informasi yang dibutuhkan frontend
        res.json({ 
            ...sesiAktif.toJSON(), 
            is_active: true, // Sudah pasti aktif karena query di atas
            status_absensi_user: absensiSiswa ? absensiSiswa.status : null
        });

    } catch (error) {
        console.error("CEK SESI AKTIF ERROR:", error);
        res.status(500).json({ message: 'Gagal mengecek sesi aktif' });
    }
});


// --- [ENDPOINT BARU] UNTUK RIWAYAT ABSENSI SISWA DI SATU KELAS ---
// --- [PERBAIKAN FINAL] Endpoint untuk RIWAYAT ABSENSI SISWA ---
app.get('/api/kelas/:kelasId/riwayat-siswa/:siswaId', async (req, res) => {
    try {
        const { kelasId, siswaId } = req.params;

        const riwayat = await Absensi.findAll({
            where: { userId: siswaId },
            include: [{
                model: SesiAbsensi,
                where: { kelasId: kelasId },
                attributes: ['id', 'waktuBuka', 'waktuTutup', 'status'],
                required: true
            }],
            attributes: ['status', 'waktuAbsen'],
            order: [['waktuAbsen', 'ASC']]
        });

        // Format data agar mudah digunakan di frontend
        const riwayatFormatted = riwayat.map(item => {
            // Gunakan waktu absen aktual untuk menentukan tanggal riwayat
            const tanggalRiwayat = new Date(item.waktuAbsen);
            
            return {
                sesiId: item.SesiAbsensi.id,
                // Format tanggal berdasarkan kapan absensi itu terjadi
                tanggal: tanggalRiwayat.toISOString().split('T')[0],
                status: item.status,
                waktuAbsen: item.waktuAbsen,
                waktuSesiBuka: item.SesiAbsensi.waktuBuka,
                waktuSesiTutup: item.SesiAbsensi.waktuTutup,
                statusSesi: item.SesiAbsensi.status
            };
        });
        res.json(riwayatFormatted);
    } catch (error) {
        console.error("GET RIWAYAT SISWA ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil data riwayat' });
    }
});

// --- [TAMBAHKAN INI] Endpoint untuk SISWA MELAKUKAN ABSENSI ---
// --- [PERBAIKAN] Endpoint untuk SISWA MELAKUKAN ABSENSI ---
app.post('/api/absensi', async (req, res) => {
    try {
        // Terima 'status' dari body request
        const { siswaId, sesiId, status } = req.body;

        // Validasi status yang masuk
        const statusAbsenValid = ['hadir', 'izin', 'sakit'];
        if (!status || !statusAbsenValid.includes(status)) {
            return res.status(400).json({ message: 'Status absensi tidak valid.' });
        }

        const sesi = await SesiAbsensi.findByPk(sesiId);
        if (!sesi || sesi.status !== 'dibuka') {
            return res.status(400).json({ message: 'Sesi absensi tidak valid atau sudah ditutup.' });
        }

        const waktuSekarang = new Date();
        const jamSekarang = waktuSekarang.toTimeString().split(' ')[0];
        if (jamSekarang < sesi.jamBuka || jamSekarang > sesi.jamTutup) {
            return res.status(400).json({ message: 'Anda berada di luar jam sesi absensi.' });
        }

        const sudahAbsen = await Absensi.findOne({ where: { userId: siswaId, sesiId } });
        if (sudahAbsen) {
            return res.status(409).json({ message: `Anda sudah tercatat '${sudahAbsen.status}' untuk sesi ini.` });
        }

        const absensiBaru = await Absensi.create({
            waktuAbsen: waktuSekarang,
            status: status, // <-- Gunakan status dari request
            userId: siswaId,
            sesiId: sesiId
        });

        res.status(201).json({ message: `Absensi '${status}' berhasil terekam!`, data: absensiBaru });

    } catch (error) {
        console.error("PROSES ABSENSI ERROR:", error);
        res.status(500).json({ message: 'Gagal memproses absensi' });
    }
});

// ... endpoint lainnya ...


// --- [FITUR BARU] Endpoint untuk MENUTUP SESI dan menandai siswa yang tidak hadir ---
// --- [PERBAIKAN] Endpoint untuk MENUTUP SESI ---
app.post('/api/sesi-absensi/:sesiId/tutup', async (req, res) => {
    try {
        const { sesiId } = req.params;
        const sesi = await SesiAbsensi.findByPk(sesiId);

        if (!sesi) return res.status(404).json({ message: 'Sesi absensi tidak ditemukan.' });
        if (sesi.status === 'ditutup') return res.status(400).json({ message: 'Sesi ini sudah ditutup.' });

        // PERBAIKAN UTAMA: Ambil kelas terlebih dahulu, baru ambil siswanya
        const kelas = await Kelas.findByPk(sesi.kelasId);
        if (!kelas) return res.status(404).json({ message: 'Kelas terkait sesi ini tidak ditemukan.' });

        const semuaSiswa = await kelas.getSiswa({ attributes: ['id'] });
        const semuaSiswaIds = semuaSiswa.map(s => s.id);

        const sudahAbsen = await Absensi.findAll({ where: { sesiId: sesiId }, attributes: ['userId'] });
        const sudahAbsenIds = sudahAbsen.map(a => a.userId);

        const belumAbsenIds = semuaSiswaIds.filter(id => !sudahAbsenIds.includes(id));

        if (belumAbsenIds.length > 0) {
            const rekamanAbsenBaru = belumAbsenIds.map(siswaId => ({
                waktuAbsen: new Date(),
                status: 'tanpa keterangan',
                userId: siswaId,
                sesiId: sesiId
            }));
            await Absensi.bulkCreate(rekamanAbsenBaru);
        }

        sesi.status = 'ditutup';
        await sesi.save();
        res.status(200).json({ message: `Sesi berhasil ditutup. ${belumAbsenIds.length} siswa ditandai tanpa keterangan.` });

    } catch (error) {
        console.error("TUTUP SESI ERROR:", error);
        res.status(500).json({ message: 'Gagal menutup sesi absensi' });
    }
});

// --- [FITUR BARU] Endpoint untuk MELIHAT LAPORAN real-time per sesi ---
app.get('/api/sesi-absensi/:sesiId/laporan', async (req, res) => {
    try {
        const { sesiId } = req.params;

        const laporan = await Absensi.findAll({
            where: { sesiId: sesiId },
            include: [{
                model: User,
                as: 'siswaAbsen', // Menggunakan alias yang sudah kita definisikan
                attributes: ['id', 'name']
            }],
            order: [['waktuAbsen', 'ASC']] // Urutkan berdasarkan waktu absen
        });

        res.status(200).json(laporan);

    } catch (error) {
        console.error("GET LAPORAN SESI ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil laporan sesi' });
    }
});
// =================================================================
// 6. JALANKAN SERVER (PALING BAWAH)
// =================================================================
app.listen(port, async () => {
  try {
    await sequelize.authenticate();
    console.log('Koneksi ke MySQL berhasil.');
    await sequelize.sync({ alter: true }); // Gunakan alter: true agar lebih aman saat development
    console.log('Semua model berhasil disinkronkan.');
    console.log(`Server berjalan di http://localhost:${port}`);
  } catch (error) {
    console.error('Gagal menjalankan server:', error);
  }
});