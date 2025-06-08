import React from 'react';

const StatCard = ({ label, value, color }) => {
  const colors = {
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800'
  };
  
  return (
    <div className={`p-4 rounded-xl shadow-lg flex items-center justify-between ${colors[color]}`}>
      <div>
        <p className="text-sm">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;