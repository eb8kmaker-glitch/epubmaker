import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: "UTC",
    getMessageFallback({ namespace, key }) {
      // Return a safe key-path string instead of crashing on missing translations
      return [namespace, key].filter(Boolean).join(".");
    },
    onError(error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[next-intl]", error.message);
      }
    },
  };
});
