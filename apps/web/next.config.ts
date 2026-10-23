import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pacotes do monorepo publicados como TypeScript puro.
  transpilePackages: ["@ifarm/shared", "@ifarm/domain", "@ifarm/db"],
  /***** Apagar este bloco para usar cache ******/
  // experimental: {
  //   turbopackFileSystemCacheForDev: false,
  // },
  /**********************************************/
};

export default nextConfig;
