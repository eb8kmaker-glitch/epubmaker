import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure pandoc-wasm is only loaded on the client (it uses WASM)
  serverExternalPackages: ["pandoc-wasm"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle pandoc-wasm on server (not used there)
      config.externals = config.externals || [];
      config.externals.push("pandoc-wasm");
    } else {
      // Client: treat .wasm as asset so it can be loaded at runtime
      config.module.rules.push({
        test: /\.wasm$/,
        type: "asset/resource",
      });
    }
    return config;
  },
};

export default nextConfig;
