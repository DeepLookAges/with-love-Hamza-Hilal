
import React from 'react';

interface AdBannerProps {
  onOpen: () => void;
}

const AdBanner: React.FC<AdBannerProps> = ({ onOpen }) => {
  return (
    <div
      onClick={onOpen}
      className="cursor-pointer group relative w-full max-w-2xl aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 transition-all duration-500 hover:shadow-purple-500/40"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 opacity-80 group-hover:opacity-70 transition-opacity duration-500"></div>
      <img
        src="https://picsum.photos/1280/720?grayscale&blur=2"
        alt="Abstract background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white p-8">
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight drop-shadow-lg">
          With Love
        </h1>
        <p className="mt-4 text-lg md:text-xl text-slate-300 drop-shadow-md">
          حوّل صورك و أفكارك إلى قصص مذهلة
        </p>
        <div className="mt-8">
          <span className="inline-block bg-purple-600 text-white font-bold text-lg px-8 py-4 rounded-full transition-all duration-300 group-hover:bg-purple-500 group-hover:scale-105 shadow-lg">
            Try it now, It's FREE!
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
