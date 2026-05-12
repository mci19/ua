import { getRequestConfig } from "next-intl/server";
import nlMessages from "../../messages/nl.json";

// Static import only — dynamic message imports break some bundlers, including
// Netlify's Next.js runtime when the locale is computed at request time.
export default getRequestConfig(async () => ({
  locale: "nl",
  messages: nlMessages,
  timeZone: "Europe/Brussels",
  now: new Date(),
}));
