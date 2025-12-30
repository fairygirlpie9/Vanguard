
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12" }) => {
  return (
    <div className={`relative ${className} group select-none`}>
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-tech-primary/10 blur-sm rounded-sm"></div>
      
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 text-tech-primary"
      >
        {/* Outer Frame - Tactical Brackets */}
        <path d="M 2 30 V 2 H 30" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
        <path d="M 70 2 H 98 V 30" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
        <path d="M 98 70 V 98 H 70" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />
        <path d="M 30 98 H 2 V 70" stroke="currentColor" strokeWidth="4" strokeLinecap="square" />

        {/* Inner V - The Vanguard Symbol */}
        <path 
            d="M 20 25 L 50 85 L 80 25" 
            stroke="currentColor" 
            strokeWidth="6" 
            strokeLinejoin="bevel"
            className="drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]"
        />
        
        {/* Top Center Notch */}
        <path d="M 40 2 L 50 12 L 60 2" stroke="currentColor" strokeWidth="2" fill="none" />

        {/* Central Eye / Sensor - Pulsing */}
        <circle cx="50" cy="45" r="3" fill="currentColor" className="animate-pulse" />
        
        {/* Decorative Tech Lines */}
        <path d="M 10 50 H 25" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        <path d="M 75 50 H 90" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      </svg>
    </div>
  );
};

export default Logo;
