'use client';

import styles from '../styles/animation.module.css';

export default function BackgroundAnimation() {
  return (
    <div className={styles.svgRoot}>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1820 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      >
        <defs>
          <rect id="masque" y="0.4" width="1820" height="1080" />
        </defs>
        <clipPath id="cache">
          <use href="#masque" />
        </clipPath>

        <g clipPath="url(#cache)">
          {/* Light Blue Lines */}
          <g className={styles.lineGroupLightBlue}>
            <line x1="200" y1="300" x2="400" y2="500" />
            <line x1="500" y1="100" x2="600" y2="300" />
            <line x1="800" y1="200" x2="950" y2="350" />
            <line x1="1300" y1="250" x2="1450" y2="400" />
            <line x1="1600" y1="50" x2="1720" y2="200" />
            <line x1="200" y1="900" x2="450" y2="700" />
            <line x1="650" y1="950" x2="800" y2="800" />
          </g>

          {/* Red Lines */}
          <g className={styles.lineGroupRed}>
            <line x1="300" y1="800" x2="500" y2="1000" />
            <line x1="700" y1="600" x2="900" y2="800" />
            <line x1="1000" y1="400" x2="1200" y2="600" />
            <line x1="1400" y1="200" x2="1600" y2="400" />
            <line x1="1700" y1="500" x2="1850" y2="650" />
            <line x1="300" y1="1000" x2="100" y2="800" />
            <line x1="500" y1="200" x2="700" y2="400" />
          </g>

          {/* Blue Lines */}
          <g className={styles.lineGroupBlue}>
            <line x1="100" y1="100" x2="300" y2="300" />
            <line x1="400" y1="400" x2="600" y2="600" />
            <line x1="700" y1="700" x2="900" y2="900" />
            <line x1="1000" y1="1000" x2="1200" y2="1200" />
            <line x1="1300" y1="800" x2="1500" y2="1000" />
            <line x1="1600" y1="600" x2="1800" y2="800" />
            <line x1="300" y1="300" x2="100" y2="500" />
          </g>
        </g>
      </svg>
    </div>
  );
}
