import { createLocalPluginRuntime, type InferBindingsFromMap } from "every-plugin/testing";

import DataProviderTemplatePlugin from "@every-plugin/template";

const pluginMap = {
  "@every-plugin/template": DataProviderTemplatePlugin,
} as const;

type AppBindings = InferBindingsFromMap<typeof pluginMap>;

const runtime = createLocalPluginRuntime<AppBindings>(
  {
    registry: {
      "@every-plugin/template": {
        remoteUrl: "http://localhost:3014/remoteEntry.js",
        description: "Local Li.Fi data provider plugin",
      },
    },
    secrets: {
      DATA_PROVIDER_API_KEY: process.env.DATA_PROVIDER_API_KEY || "not-required",
    },
  },
  pluginMap
);

export const { router: dataProviderRouter } = await runtime.usePlugin("@every-plugin/template", {
  variables: {
    baseUrl: process.env.DATA_PROVIDER_BASE_URL || "https://li.quest/v1",
    defillamaBaseUrl: process.env.DATA_PROVIDER_DEFILLAMA_BASE_URL || "https://bridges.llama.fi",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 15000,
    maxRequestsPerSecond: Number(process.env.DATA_PROVIDER_MAX_REQUESTS_PER_SECOND) || 10,
  },
  secrets: { apiKey: "{{DATA_PROVIDER_API_KEY}}" },
});
