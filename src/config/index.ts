import "dotenv/config";

export const config = {
  port: process.env.PORT ?? 3008,

  ACCESS_TOKEN: process.env.ACCESS_TOKEN,
  PAGE_ID: process.env.PAGE_ID,
  VERIFY_TOKEN: process.env.VERIFY_TOKEN,
  VERSION: process.env.VERSION ?? "v19.0",
};
