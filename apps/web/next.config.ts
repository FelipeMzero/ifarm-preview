import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pacote do monorepo publicado como TypeScript puro.
  transpilePackages: ["@ifarm/shared"],
  /***** Apagar este bloco para usar cache ******/
  // experimental: {
  //   turbopackFileSystemCacheForDev: false,
  // },
  /**********************************************/
};

export default nextConfig;
