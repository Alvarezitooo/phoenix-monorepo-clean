import React, { useState } from 'react';

const WhyPopover: React.FC = () => {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className="relative">
      <button 
        className="text-sm text-blue-500 hover:text-blue-600 underline"
        onClick={() => setShowPopover(!showPopover)}
      >
        Pourquoi ?
      </button>
      
      {showPopover && (
        <div className="absolute top-6 right-0 z-10 w-64 p-3 bg-white border rounded-lg shadow-lg">
          <div className="text-xs text-gray-600">
            <p className="mb-2">
              <strong>Pourquoi je te demande ça ?</strong>
            </p>
            <p>
              Pour affiner tes pistes métier et personnaliser tes prochains chapitres. 
              Tes réponses t'appartiennent et restent exportables 🌙
            </p>
            <button 
              className="mt-2 text-xs text-blue-500 hover:underline"
              onClick={() => setShowPopover(false)}
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhyPopover;