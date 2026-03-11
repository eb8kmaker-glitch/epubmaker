import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // pandoc-wasm is used by /api/convert; externalize so Node loads it at runtime (WASM in node_modules)
  serverExternalPackages: ["pandoc-wasm"],
  webpack: (config, { isServer }) => {
    if (isServer) {
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

export default withNextIntl(nextConfig);
