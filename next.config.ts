import type { NextConfig } from "next";

import { dirname } from "path";
import { fileURLToPath } from "url";

const appRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
