import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.timekeeper.caregiver',
  appName: 'TimeKeeper',
  webDir: 'dist',
  android: {
    backgroundColor: '#F4EFE6',
  },
  plugins: {
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
};

export default config;
