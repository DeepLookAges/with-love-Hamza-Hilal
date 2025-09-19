
import React, { useState, useCallback } from 'react';
import AdBanner from './components/AdBanner';
import GeneratorModal from './components/GeneratorModal';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-700/[0.2] bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,white)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(190,_55,_245,_0.2),_transparent)]"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <AdBanner onOpen={openModal} />
      </div>

      <GeneratorModal isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );
}

export default App;
