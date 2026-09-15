import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(import.meta.dirname),
  },
  // Makes <Link href> and router.push() accept only routes that actually
  // exist. Without it a typo like "/servces" compiles happily and becomes a
  // 404 somebody finds later.
  typedRoutes: true,
};

export default nextConfig;
