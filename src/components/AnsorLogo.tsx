import React from 'react';

interface AnsorLogoProps {
  className?: string;
  size?: number | string;
}

/**
 * Official GP Ansor Triangular Logo (Emblem)
 * Matches the official letterhead of PW GP Ansor Jawa Barat
 */
export default function AnsorLogo({ className = '', size = 80 }: AnsorLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Triangle with soft drop shadow */}
      <defs>
        <filter id="ansorShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#064e3b" floodOpacity="0.25" />
        </filter>
        <linearGradient id="ansorGreenGrad" x1="100" y1="15" x2="100" y2="185" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#15803d" />
          <stop offset="50%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>

      {/* Main Triangular Background */}
      <polygon
        points="100,14 186,176 14,176"
        fill="#0d703d"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <polygon
        points="100,22 178,170 22,170"
        fill="#0a5c31"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Radiant Sunburst Rays */}
      <g stroke="#34d399" strokeWidth="1.2" opacity="0.6">
        <line x1="100" y1="95" x2="100" y2="40" />
        <line x1="100" y1="95" x2="135" y2="55" />
        <line x1="100" y1="95" x2="155" y2="85" />
        <line x1="100" y1="95" x2="155" y2="120" />
        <line x1="100" y1="95" x2="65" y2="55" />
        <line x1="100" y1="95" x2="45" y2="85" />
        <line x1="100" y1="95" x2="45" y2="120" />
      </g>

      {/* Crescent Moon */}
      <path
        d="M 100,68 A 28,28 0 1 0 126,118 A 24,24 0 1 1 100,68 Z"
        fill="#ffffff"
        opacity="0.9"
      />

      {/* 9 Stars (Wali Songo) */}
      {/* Central Big Star */}
      <polygon
        points="100,62 103,71 112,71 105,77 107,86 100,81 93,86 95,77 88,71 97,71"
        fill="url(#goldGrad)"
      />
      {/* 4 Stars on top arc */}
      <polygon points="76,64 78,70 84,70 79,74 81,80 76,76 71,80 73,74 68,70 74,70" fill="#ffffff" transform="scale(0.8) translate(20, 10)" />
      <polygon points="124,64 126,70 132,70 127,74 129,80 124,76 119,80 121,74 116,70 122,70" fill="#ffffff" transform="scale(0.8) translate(30, 10)" />
      <polygon points="56,80 58,85 63,85 59,88 61,93 56,90 51,93 53,88 49,85 54,85" fill="#ffffff" />
      <polygon points="144,80 146,85 151,85 147,88 149,93 144,90 139,93 141,88 137,85 142,85" fill="#ffffff" />
      {/* 4 Stars on bottom arc */}
      <polygon points="62,112 64,116 68,116 65,119 66,123 62,120 58,123 59,119 56,116 60,116" fill="#ffffff" />
      <polygon points="138,112 140,116 144,116 141,119 142,123 138,120 134,123 135,119 132,116 136,116" fill="#ffffff" />
      <polygon points="78,128 80,132 84,132 81,135 82,139 78,136 74,139 75,135 72,132 76,132" fill="#ffffff" />
      <polygon points="122,128 124,132 128,132 125,135 126,139 122,136 118,139 119,135 116,132 120,132" fill="#ffffff" />

      {/* Banner / Ribbon for ANSOR */}
      <path
        d="M 30,140 Q 100,146 170,140 L 175,165 Q 100,172 25,165 Z"
        fill="#043c1f"
        stroke="#ffffff"
        strokeWidth="1.5"
      />

      {/* ANSOR Wordmark */}
      <text
        x="100"
        y="160"
        textAnchor="middle"
        fill="#ffffff"
        fontWeight="900"
        fontSize="21"
        fontFamily="sans-serif"
        letterSpacing="2.5"
      >
        ANSOR
      </text>
    </svg>
  );
}
