import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

// Google Drive Logo - Usando o ícone fornecido
export function GoogleDriveLogoColored({ className = "h-4 w-4", size }: LogoProps) {
  return (
    <img
      src="/icons/drive.svg"
      alt="Google Drive"
      className={className}
      width={size}
      height={size}
    />
  );
}

// OneDrive Logo - Usando o ícone fornecido
export function OneDriveLogoColored({ className = "h-4 w-4", size }: LogoProps) {
  return (
    <img
      src="/icons/onedrive.svg"
      alt="OneDrive"
      className={className}
      width={size}
      height={size}
    />
  );
}

// Dropbox Logo - Mantendo o SVG atual (já estava bom)
export function DropboxLogoColored({ className = "h-4 w-4", size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      width={size}
      height={size}
    >
      <path d="M6 2L0 7l6 5-6 5 6 5 6-5-6-5 6-5-6-5zm12 0l-6 5 6 5-6 5 6 5 6-5-6-5 6-5-6-5z" fill="#0061FF"/>
    </svg>
  );
}

// Versões em preto e branco para temas escuros
export function GoogleDriveLogo({ className = "h-4 w-4", size }: LogoProps) {
  return (
    <img
      src="/icons/drive.svg"
      alt="Google Drive"
      className={className}
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%)' }}
    />
  );
}

export function OneDriveLogo({ className = "h-4 w-4", size }: LogoProps) {
  return (
    <img
      src="/icons/onedrive.svg"
      alt="OneDrive"
      className={className}
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%)' }}
    />
  );
}

export function DropboxLogo({ className = "h-4 w-4", size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      width={size}
      height={size}
      fill="currentColor"
    >
      <path d="M6 2L0 7l6 5-6 5 6 5 6-5-6-5 6-5-6-5zm12 0l-6 5 6 5-6 5 6 5 6-5-6-5 6-5-6-5z"/>
    </svg>
  );
}