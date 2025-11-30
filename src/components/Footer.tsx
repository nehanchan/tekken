'use client';

interface FooterProps {
  isMobile?: boolean;
  className?: string;
}

export default function Footer({ isMobile = false, className = '' }: FooterProps) {
  return (
    <footer 
      className={className}
      style={{
        width: '100%',
        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 1))',
        margin: 0,
        padding: 0
      }}
    >
      <div 
        className="w-full py-6 px-5 text-center"
        style={{
          maxWidth: '100%'
        }}
      >
        <p 
          className="text-white font-semibold mb-1"
          style={{
            fontSize: isMobile ? '13px' : '15px',
            lineHeight: '1.6',
            letterSpacing: '0.5px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.9)'
          }}
        >
          TEKKEN™8 & ©Bandai Namco Entertainment Inc.
        </p>
      </div>
    </footer>
  );
}
