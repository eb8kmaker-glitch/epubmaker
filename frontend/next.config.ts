import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

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

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG ?? "epubmaker",
  project: process.env.SENTRY_PROJECT ?? "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
};

export default withSentryConfig(
  withNextIntl(nextConfig),
  sentryWebpackPluginOptions
);
