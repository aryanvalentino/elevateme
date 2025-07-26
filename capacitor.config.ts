import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e866bdcea26c4508b2cf014eab158c2f',
  appName: 'Elevate Me',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: "https://e866bdce-a26c-4508-b2cf-014eab158c2f.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    App: {
      handleDeepLinks: true,
    },
  },
};

export default config;