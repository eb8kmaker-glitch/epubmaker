import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // pandoc-wasm, pdf-parse, epubcheck used by API routes; externalize so Node loads at runtime
  serverExternalPackages: ["pandoc-wasm", "pdf-parse", "@likecoin/epubcheck-ts"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("pandoc-wasm", "pdf-parse", "@likecoin/epubcheck-ts");
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
