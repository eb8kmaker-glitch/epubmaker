import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ko", "es", "ja", "zh", "pt", "de", "fr"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
});
