import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RegisterForm from "../components/RegisterForm.jsx"; // Import komponen RegisterForm

const AuthPage = () => {
  // Nama komponen diubah menjadi AuthPage
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("siswa");
  const [error, setError] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true); // State baru untuk mode login/registrasi
  const navigate = useNavigate();

  // Fungsi untuk menangani login (logika yang sudah ada)
  const handleLoginSubmit = async (e) => {
    // Mengganti nama fungsi untuk menghindari konflik
    e.preventDefault();
    setError(""); // Bersihkan error sebelumnya
    try {
      const response = await axios.post("http://localhost:3001/login", {
        email,
        password,
        role,
      });
      if (response.data.success) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        if (response.data.user.role === "dosen") {
          navigate("/dosen");
        } else {
          navigate("/siswa");
        }
      }
    } catch (err) {
      // Pastikan err.response ada dan memiliki data.message untuk pesan error yang lebih baik
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Login gagal. Terjadi kesalahan saat menghubungi server.");
      }
      console.error("Login error:", err);
    }
  };

  // Fungsi baru untuk menangani registrasi
 // Ganti fungsi lama Anda dengan yang ini
const handleRegisterSubmit = async ({ name, email: regEmail, password: regPassword, role: regRole }) => {
  setError(""); // Bersihkan error sebelumnya
  try {
    const response = await axios.post("http://localhost:3001/register", {
      name,
      email: regEmail,
      password: regPassword,
      role: regRole,
    });

    // INI BAGIAN YANG DIPERBAIKI:
    // Kita memeriksa response.status (yang bernilai 201 jika sukses), 
    // bukan response.data.success (yang tidak ada).
    if (response.status === 201) { 
      alert("Registrasi berhasil! Silakan login dengan akun baru Anda.");
      setIsLoginMode(true); // Kembali ke mode login
      setEmail(regEmail); // Mengisi email di form login secara otomatis
      setPassword(""); // Kosongkan password setelah registrasi
    }
    
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      setError(err.response.data.message);
    } else {
      setError("Registrasi gagal. Terjadi kesalahan server.");
    }
    console.error("Registration error:", err);
  }
};

  return (
    // Wadah ini sekarang transparan dan hanya berfungsi untuk menengahkan form
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      {/* Bentuk oranye di kiri atas */}
      <div className="absolute top-[-10rem] left-[-15rem] w-96 h-96 rounded-full bg-orange-400 z-0"></div>
      {/* Bentuk biru di kanan bawah */}
      <div className="absolute bottom-[-10rem] right-[-15rem] w-96 h-96 rounded-full bg-blue-500 z-0"></div>

      <div className="p-8 bg-white rounded-lg shadow-lg w-full max-w-sm z-10">
        {" "}
        {/* z-10 agar form di atas bentuk background */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isLoginMode ? "Login Absensi" : "Registrasi Akun"}
        </h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {isLoginMode ? (
          // Form Login
          <form onSubmit={handleLoginSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Masuk sebagai</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="siswa">Siswa</option>
                <option value="dosen">Dosen</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Login
            </button>
          </form>
        ) : (
          // Form Registrasi
          <RegisterForm onRegister={handleRegisterSubmit} />
        )}
        <div className="mt-6 text-center">
          {isLoginMode ? (
            <p>
              Belum punya akun?{" "}
              <button
                onClick={() => setIsLoginMode(false)}
                className="text-blue-600 hover:underline font-medium"
              >
                Daftar sekarang
              </button>
            </p>
          ) : (
            <p>
              Sudah punya akun?{" "}
              <button
                onClick={() => setIsLoginMode(true)}
                className="text-blue-600 hover:underline font-medium"
              >
                Login di sini
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage; // Nama komponen diubah menjadi AuthPage