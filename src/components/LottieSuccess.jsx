'use client';

import { useEffect } from 'react';

export default function LottieSuccess() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs';
    script.type = 'module';
    document.body.appendChild(script);
  }, []);

  return (
    <dotlottie-player
      src="https://lottie.host/73a2e871-0242-4fd0-a19e-2a3161af4f92/WvyEssKgOC.lottie"
      background="transparent"
      speed="1"
      style={{ width: '300px', height: '300px' }}
      loop
      autoplay
    ></dotlottie-player>
  );
}
