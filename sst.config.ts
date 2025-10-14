// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "fortuna",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    new sst.aws.Nextjs("fortuna", {
      domain: "fortuna.illizen.com",
      server: {
        runtime: "nodejs22.x",
      },
      environment: {
        DATABASE_URL: process.env.DATABASE_URL,
        AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
        AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
        AUTH_SECRET: process.env.AUTH_SECRET,
        AUTH_TRUST_HOST: "true",
        PRODUCTION_URL: process.env.PRODUCTION_URL,
      },
    });
  },
});
