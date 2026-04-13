import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sodacristal",
  appName: "sodacristal",
  webDir: "dist",
  server: {
    hostname: "localhost",

    androidScheme: "https",
  },
};

export default config;
