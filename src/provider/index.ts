import { createProvider } from "@builderbot/bot";
import { MetaProvider as Provider } from "@builderbot/provider-meta";
import { config } from "../config"

export const provider = createProvider(Provider, {
  accessToken: config.ACCESS_TOKEN,   // 👈 correcto
  pageId: config.PAGE_ID,             // 👈 correcto
  verifyToken: config.VERIFY_TOKEN,   // 👈 correcto
  version: config.VERSION,            // opcional
});
