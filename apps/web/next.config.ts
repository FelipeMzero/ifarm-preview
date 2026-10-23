import type { NextConfig } from "next";

// Endereço da API (apps/api). O navegador continua chamando /api/* no próprio site, e o Next
// repassa para ela: mesma origem, sem CORS. Em produção, o proxy reverso faz esse papel.
const API_URL = process.env.API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // Pacote do monorepo publicado como TypeScript puro.
  transpilePackages: ["@ifarm/shared"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
  /***** Apagar este bloco para usar cache ******/
  // experimental: {
  //   turbopackFileSystemCacheForDev: false,
  // },
  /**********************************************/
};

export default nextConfig;
