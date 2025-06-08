import React from 'react';
import DatePicker from 'react-datepicker';

const MainAttendanceCard = ({ selectedDate, setSelectedDate, userName }) => {
  const CustomCalendarButton = React.forwardRef(({ value, onClick }, ref) => (
    <button onClick={onClick} ref={ref} className="bg-white p-3 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>
  ));

  return (
    <div className="bg-orange-500 text-white p-6 rounded-lg shadow-md flex justify-between items-center">
      <div>
        <p className="text-sm font-semibold text-orange-100">Selamat Datang, {userName}!</p>
        <h2 className="text-3xl font-bold">Absensi Siswa</h2>
      </div>
      <div>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          customInput={<CustomCalendarButton />}
        />
      </div>
    </div>
  );
};

export default MainAttendanceCard;