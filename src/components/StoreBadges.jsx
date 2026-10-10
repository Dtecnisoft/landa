import React from 'react';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.landaappsas.landa&pcampaignid=web_share';
export const APP_STORE_URL = 'https://apps.apple.com/co/app/landa-app/id6811683400';

/**
 * Insignia oficial de Apple App Store ("Descárgala de la App Store")
 */
export function AppStoreBadge({ height = 44, style = {}, className = '' }) {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`store-badge-official app-store-badge ${className}`}
      style={{
        display: 'inline-block',
        lineHeight: 0,
        borderRadius: '8px',
        transition: 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease',
        ...style
      }}
      title="Descárgala de la App Store"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <svg
        viewBox="0 0 156 46"
        height={height}
        style={{ height: `${height}px`, width: 'auto', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0.5" y="0.5" width="155" height="45" rx="8" fill="#000000" stroke="#A6A6A6" strokeWidth="1" />
        {/* Apple Icon */}
        <path
          fill="#FFFFFF"
          d="M27.67 22.8c-.02-3.13 2.55-4.63 2.67-4.7-1.46-2.12-3.73-2.42-4.54-2.45-1.92-.19-3.76 1.13-4.73 1.13-.98 0-2.49-1.11-4.09-1.08-2.1.03-4.03 1.22-5.11 3.1-2.18 3.79-.56 9.4 1.57 12.46 1.04 1.5 2.27 3.18 3.9 3.12 1.56-.06 2.16-1.01 4.05-1.01s2.43 1.01 4.07.98c1.68-.03 2.74-1.52 3.77-3.03 1.19-1.74 1.68-3.42 1.71-3.51-.04-.02-3.26-1.25-3.28-5.01zM24.28 14.15c.86-1.05 1.45-2.5 1.29-3.95-1.25.05-2.75.83-3.64 1.88-.79.91-1.48 2.39-1.29 3.8 1.39.11 2.8-.7 3.64-1.73z"
        />
        {/* Text "Descárgala de la" */}
        <text
          x="44"
          y="16.5"
          fill="#FFFFFF"
          fontSize="9.5"
          fontWeight="400"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          letterSpacing="0.2px"
        >
          Descárgala de la
        </text>
        {/* Text "App Store" */}
        <text
          x="44"
          y="34.5"
          fill="#FFFFFF"
          fontSize="17.5"
          fontWeight="700"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          letterSpacing="-0.3px"
        >
          App Store
        </text>
      </svg>
    </a>
  );
}

/**
 * Insignia oficial de Google Play Store ("DISPONIBLE EN / OBTENLA EN Google Play")
 */
export function PlayStoreBadge({ height = 44, style = {}, className = '' }) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`store-badge-official play-store-badge ${className}`}
      style={{
        display: 'inline-block',
        lineHeight: 0,
        borderRadius: '8px',
        transition: 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease',
        ...style
      }}
      title="Disponible en Google Play"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <svg
        viewBox="0 0 156 46"
        height={height}
        style={{ height: `${height}px`, width: 'auto', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0.5" y="0.5" width="155" height="45" rx="8" fill="#000000" stroke="#A6A6A6" strokeWidth="1" />
        {/* Google Play Triangle Logo */}
        <g transform="translate(13, 9.5) scale(0.65)">
          <path fill="#00E676" d="M3.7 1.6C2.6 2.8 2 4.6 2 6.8v28.4c0 2.2.6 4 1.7 5.2l.2.2L20.2 24.3v-.5L3.9 1.4l-.2.2z" />
          <path fill="#FFD600" d="M25.7 29.8l-5.5-5.5v-.5l5.5-5.5.1.1 6.5 3.7c1.9 1.1 1.9 2.8 0 3.9l-6.6 3.8z" />
          <path fill="#FF3D00" d="M25.8 29.7L20.2 24 3.7 40.4c.6.6 1.6.7 2.8 0l19.3-10.7z" />
          <path fill="#00B0FF" d="M25.8 18.3L6.5 7.6c-1.2-.7-2.2-.6-2.8 0L20.2 24l5.6-5.7z" />
        </g>
        {/* Text "DISPONIBLE EN" */}
        <text
          x="44"
          y="16.5"
          fill="#FFFFFF"
          fontSize="8.5"
          fontWeight="600"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          letterSpacing="0.8px"
        >
          DISPONIBLE EN
        </text>
        {/* Text "Google Play" */}
        <text
          x="44"
          y="34.5"
          fill="#FFFFFF"
          fontSize="17.5"
          fontWeight="700"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          letterSpacing="-0.2px"
        >
          Google Play
        </text>
      </svg>
    </a>
  );
}

/**
 * Grupo de insignias oficiales (App Store y Google Play juntos)
 */
export function StoreBadgesGroup({ height = 44, gap = '0.75rem', style = {}, className = '' }) {
  return (
    <div
      className={`store-badges-group ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        flexWrap: 'wrap',
        ...style
      }}
    >
      <AppStoreBadge height={height} />
      <PlayStoreBadge height={height} />
    </div>
  );
}
