import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string(),
    LEMONSQUEEZY_CHECKOUT_URL: z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID: z.string().optional(),
  },
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    LEMONSQUEEZY_CHECKOUT_URL: process.env.LEMONSQUEEZY_CHECKOUT_URL,
    NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID: process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});