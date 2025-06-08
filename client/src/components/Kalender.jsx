import React from 'react';
import { format, startOfWeek, addDays, subDays, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';

const RecentAttendance = ({ selectedDate, onDateChange }) => {

    // --- FUNGSI NAVIGASI YANG DIPERBAIKI ---
    // Menggunakan date-fns untuk memastikan penambahan/pengurangan hari yang akurat
    const handlePrevWeek = () => {
        onDateChange(subDays(selectedDate, 7));
    };

    const handleNextWeek = () => {
        onDateChange(addDays(selectedDate, 7));
    };

    // --- GENERATE TANGGAL UNTUK SATU MINGGU ---
    // Logika disederhanakan menggunakan date-fns
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Mulai dari hari Senin
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    // Format rentang tanggal untuk header
    const startRange = format(weekDates[0], 'd');
    const endRange = format(weekDates[6], 'd MMMM yyyy', { locale: id });
    const dateRange = `${startRange} - ${endRange}`;

    const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Kalender</h3>
                    <p className="text-sm text-gray-500">{dateRange}</p>
                </div>
                {/* Tombol Navigasi sekarang memanggil fungsi yang benar */}
                <div className="flex items-center space-x-2">
                    
                    <span className="font-semibold text-sm text-gray-700 w-28 text-center">
                        {format(selectedDate, 'MMMM yyyy', { locale: id })}
                    </span>
                    
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
                {weekDates.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                        <div
                            key={index}
                            onClick={() => onDateChange(date)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-gray-100 hover:bg-blue-50'
                            }`}
                        >
                            <p className={`text-xs font-bold mb-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                {dayNames[index]}
                            </p>
                            <p className="font-bold text-lg">{format(date, 'd')}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecentAttendance;