import React from 'react';

const DisclaimerFooter: React.FC = () => {
  return (
    <footer className="text-center text-xs text-gray-500 p-4 border-t mt-6">
      <p className="mb-2">
        🌙 <strong>Suggestions, pas de verdicts.</strong> Tu peux ajuster et exporter.
      </p>
      <p>
        Ton histoire t'appartient. Export possible à tout moment.
      </p>
    </footer>
  );
};

export default DisclaimerFooter;