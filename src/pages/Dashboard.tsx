import { open } from "@tauri-apps/plugin-dialog";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { ApiEndpoint } from "../components/ApiEndpoint";
import { openCommandPalette } from "../components/CommandPalette";
import { CopilotCard } from "../components/CopilotCard";
import { ProviderSection } from "../components/dashboard/ProviderSection";
import {
  ClaudeQuotaWidget,
  CodexQuotaWidget,
  CopilotQuotaWidget,
  KiroQuotaWidget,
  QuotaWidget,
} from "../components/dashboard/quotas";
import { DeviceCodeModal } from "../components/DeviceCodeModal";
import { OAuthModal } from "../components/OAuthModal";
import { StatusIndicator } from "../components/StatusIndicator";
import { Button } from "../components/ui";
import { useI18n } from "../i18n";
import {
  type AgentConfigResult,
  type AvailableModel,
  appendToShellProfile,
  completeOAuth,
  type CopilotConfig,
  type DeviceCodeResponse,
  detectCliAgents,
  disconnectProvider,
  getDeviceCode,
  getOAuthUrl,
  getUsageStats,
  importVertexCredential,
  type OAuthUrlResponse,
  onOAuthCallback,
  onRequestLog,
  openUrlInBrowser,
  type Provider,
  pollOAuthStatus,
  refreshAuthStatus,
  startProxy,
  stopProxy,
  syncUsageFromProxy,
  type UsageStats,
} from "../lib/tauri";
import { appStore } from "../stores/app";
import { requestStore } from "../stores/requests";
import { toastStore } from "../stores/toast";

const providers = [
  { logo: "/logos/claude.svg", name: "Claude", provider: "claude" as Provider },
  {
    logo: "/logos/openai.svg",
    name: "ChatGPT",
    provider: "openai" as Provider,
  },
  { logo: "/logos/gemini.svg", name: "Gemini", provider: "gemini" as Provider },
  { logo: "/logos/qwen.png", name: "Qwen", provider: "qwen" as Provider },
  { logo: "/logos/iflow.svg", name: "iFlow", provider: "iflow" as Provider },
  {
    logo: "/logos/vertex.svg",
    name: "Vertex AI",
    provider: "vertex" as Provider,
  },
  {
    logo: "/logos/antigravity.webp",
    name: "Antigravity",
    provider: "antigravity" as Provider,
  },
  {
    logo: "/logos/kiro.svg",
    name: "Kiro",
    provider: "kiro" as Provider,
  },
  {
    logo: "/logos/kimi.png",
    name: "Kimi",
    provider: "kimi" as Provider,
  },
];

// Compact KPI tile - matches Analytics StatCard styling
function KpiTile(props: {
  icon: "bolt" | "check" | "dollar";
  label: string;
  onClick?: () => void;
  subtext?: string;
  value: string;
}) {
  const icons = {
    bolt: (
      <svg
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M13 10V3L4 14h7v7l9-11h-7z"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
        />
      </svg>
    ),
    check: (
      <svg
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
        />
      </svg>
    ),
    dollar: (
      <svg
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
        />
      </svg>
    ),
  };

  return (
    <button
      class={`rounded-xl border border-orange-100 bg-orange-50 p-3 text-left text-[#9a4a12] transition-all hover:scale-[1.02] hover:shadow-md dark:border-orange-900/40 dark:bg-[#2b211a] dark:text-orange-200 ${props.onClick ? "cursor-pointer" : "cursor-default"}`}
      onClick={props.onClick}
    >
      <div class="mb-1 flex items-center gap-1.5 opacity-80">
        {icons[props.icon]}
        <span class="text-[10px] font-medium uppercase tracking-wider">
          {props.label}
        </span>
      </div>
      <p class="text-xl font-bold tabular-nums">{props.value}</p>
      <Show when={props.subtext}>
        <p class="mt-0.5 text-[10px] opacity-70">{props.subtext}</p>
      </Show>
    </button>
  );
}

function ConnectedProvidersSection(props: {
  connected: Array<{ logo: string; name: string; provider: Provider }>;
}) {
  return (
    <div class="rounded-[28px] border border-orange-100 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
            Connected network
          </p>
          <h2 class="mt-2 text-xl font-semibold text-gray-900">
            Providers connected to DevGate
          </h2>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            A quick view of the active provider network currently available
            through your DevGate workspace.
          </p>
        </div>
        <div class="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-right">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">
            Active
          </p>
          <p class="mt-1 text-2xl font-semibold text-gray-900">
            {props.connected.length}
          </p>
        </div>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-center">
        <div class="rounded-[24px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 text-center shadow-sm">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
            <img
              alt="DevGate"
              class="h-10 w-10 object-contain"
              src="/proxypal-black.png"
            />
          </div>
          <p class="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
            Hub
          </p>
          <p class="mt-1 text-lg font-semibold text-gray-900">DevGate</p>
          <p class="mt-2 text-sm text-gray-500">
            Routes requests to your connected providers.
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <For each={props.connected}>
            {(provider) => (
              <div class="relative rounded-[24px] border border-orange-100 bg-[#fffaf4] p-4 shadow-sm">
                <div class="absolute -left-3 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-orange-200 xl:block" />
                <div class="flex items-center gap-3">
                  <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <img
                      alt={provider.name}
                      class="h-6 w-6 object-contain"
                      src={provider.logo}
                    />
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">
                      Provider
                    </p>
                    <p class="truncate text-base font-semibold text-gray-900">
                      {provider.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useI18n();
  const {
    authStatus,
    config,
    proxyStatus,
    setAuthStatus,
    setConfig,
    setCurrentPage,
    setProxyStatus,
  } = appStore;
  const [toggling, setToggling] = createSignal(false);
  const [connecting, setConnecting] = createSignal<Provider | null>(null);
  const [recentlyConnected, setRecentlyConnected] = createSignal<Set<Provider>>(
    new Set(),
  );
  const [hasConfiguredAgent, setHasConfiguredAgent] = createSignal(false);
  const [refreshingAgents, setRefreshingAgents] = createSignal(false);
  const [configResult, setConfigResult] = createSignal<{
    agentName: string;
    models?: AvailableModel[];
    result: AgentConfigResult;
  } | null>(null);
  // No dismiss state - onboarding stays until setup complete
  // Use centralized store for history
  const history = requestStore.history;
  const [stats, setStats] = createSignal<UsageStats | null>(null);

  // OAuth Modal state
  const [oauthModalProvider, setOauthModalProvider] =
    createSignal<Provider | null>(null);
  const [oauthUrlData, setOauthUrlData] = createSignal<OAuthUrlResponse | null>(
    null,
  );
  const [oauthLoading, setOauthLoading] = createSignal(false);
  const [showManualCodeInput, setShowManualCodeInput] = createSignal(false);
  // Guard: prevents race between deep-link callback, polling, and manual code submission.
  // First completion path to set this wins; others bail out.
  const [oauthCompleted, setOauthCompleted] = createSignal(false);

  // Device Code Modal state
  const [deviceCodeProvider, setDeviceCodeProvider] =
    createSignal<Provider | null>(null);
  const [deviceCodeData, setDeviceCodeData] =
    createSignal<DeviceCodeResponse | null>(null);

  // Providers that support device-code login
  const deviceCodeProviders = new Set<Provider>(["openai", "qwen"]);

  const getProviderName = (provider: Provider): string => {
    const found = providers.find((p) => p.provider === provider);
    return found?.name || provider;
  };

  // Copilot config handler
  const handleCopilotConfigChange = (copilotConfig: CopilotConfig) => {
    setConfig({ ...config(), copilot: copilotConfig });
  };

  // Load data on mount
  const loadAgents = async () => {
    if (refreshingAgents()) {
      return;
    }
    setRefreshingAgents(true);
    try {
      const detected = await detectCliAgents();
      setHasConfiguredAgent(detected.some((a) => a.configured));
    } catch (error) {
      console.error("Failed to load agents:", error);
      toastStore.error(
        t("agentSetup.toasts.failedToDetectCliAgents"),
        String(error),
      );
    } finally {
      setRefreshingAgents(false);
    }
  };

  onMount(async () => {
    // Load agents - handle independently to avoid one failure blocking others
    try {
      const agentList = await detectCliAgents();
      setHasConfiguredAgent(agentList.some((a) => a.configured));
    } catch (error) {
      console.error("Failed to detect CLI agents:", error);
    }

    // Load history from centralized store
    try {
      await requestStore.loadHistory();

      // Sync real token data from proxy if running
      if (appStore.proxyStatus().running) {
        try {
          await syncUsageFromProxy();
          await requestStore.loadHistory(); // Reload to get synced data
        } catch (error) {
          console.warn("Failed to sync usage from proxy:", error);
          // Continue with disk-only history
        }
      }
    } catch (error) {
      console.error("Failed to load request history:", error);
    }

    // Load usage stats
    try {
      const usage = await getUsageStats();
      setStats(usage);
    } catch (error) {
      console.error("Failed to load usage stats:", error);
    }

    // Listen for new requests and refresh stats only
    // History is handled by RequestMonitor via centralized store
    const unlisten = await onRequestLog(async () => {
      // Debounce: wait 1 second after request to allow backend to process
      setTimeout(async () => {
        try {
          // Refresh stats only - history is updated by RequestMonitor
          const usage = await getUsageStats();
          setStats(usage);
        } catch (error) {
          console.error("Failed to refresh stats after new request:", error);
        }
      }, 1000);
    });

    // Listen for deep-link OAuth callback (faster than polling)
    const unlistenOAuth = await onOAuthCallback(async (data) => {
      const provider = oauthModalProvider();
      if (!provider || data.provider !== provider || oauthCompleted()) {
        return;
      }
      setOauthCompleted(true);
      try {
        const newAuth = await completeOAuth(data.provider, data.code);
        setAuthStatus(newAuth);
        setOauthLoading(false);
        setOauthModalProvider(null);
        setOauthUrlData(null);
        setShowManualCodeInput(false);
        setRecentlyConnected((prev) => new Set([...prev, provider]));
        setTimeout(() => {
          setRecentlyConnected((prev) => {
            const next = new Set(prev);
            next.delete(provider);
            return next;
          });
        }, 2000);
        toastStore.success(
          t("dashboard.toasts.providerConnected", {
            provider: getProviderName(provider),
          }),
          t("dashboard.toasts.youCanNowUseThisProvider"),
        );
      } catch (error) {
        console.error("OAuth callback completion failed:", error);
        setOauthCompleted(false); // Allow retry via other paths
      }
    });

    // Cleanup listener on unmount
    onCleanup(() => {
      unlisten();
      unlistenOAuth();
    });
  });

  // Setup complete when: proxy running + provider connected + agent configured
  const isSetupComplete = () =>
    proxyStatus().running && hasAnyProvider() && hasConfiguredAgent();

  // Onboarding shows until setup complete (no dismiss option)

  const toggleProxy = async () => {
    if (toggling()) {
      return;
    }
    setToggling(true);
    try {
      if (proxyStatus().running) {
        const status = await stopProxy();
        setProxyStatus(status);
        toastStore.info(t("dashboard.toasts.proxyStopped"));
      } else {
        const status = await startProxy();
        setProxyStatus(status);
        toastStore.success(
          t("dashboard.toasts.proxyStarted"),
          t("dashboard.toasts.listeningOnPort", { port: status.port }),
        );
      }
    } catch (error) {
      console.error("Failed to toggle proxy:", error);
      toastStore.error(
        t("dashboard.toasts.failedToToggleProxy"),
        String(error),
      );
    } finally {
      setToggling(false);
    }
  };

  const handleConnect = async (provider: Provider) => {
    if (!proxyStatus().running) {
      toastStore.warning(
        t("dashboard.toasts.startProxyFirst"),
        t("dashboard.toasts.proxyMustRunToConnectAccounts"),
      );
      return;
    }

    // Vertex uses service account import, not OAuth
    if (provider === "vertex") {
      setConnecting(provider);
      toastStore.info(
        t("dashboard.toasts.importVertexServiceAccount"),
        t("dashboard.toasts.selectServiceAccountJson"),
      );
      try {
        const selected = await open({
          filters: [{ extensions: ["json"], name: "JSON" }],
          multiple: false,
        });
        const selectedPath = Array.isArray(selected) ? selected[0] : selected;
        if (!selectedPath) {
          setConnecting(null);
          toastStore.warning(
            t("dashboard.toasts.noFileSelected"),
            t("dashboard.toasts.chooseServiceAccountJson"),
          );
          return;
        }
        await importVertexCredential(selectedPath);
        const newAuth = await refreshAuthStatus();
        setAuthStatus(newAuth);
        setConnecting(null);
        setRecentlyConnected((prev) => new Set([...prev, provider]));
        setTimeout(() => {
          setRecentlyConnected((prev) => {
            const next = new Set(prev);
            next.delete(provider);
            return next;
          });
        }, 2000);
        toastStore.success(
          t("dashboard.toasts.vertexConnected"),
          t("dashboard.toasts.serviceAccountImportedSuccessfully"),
        );
      } catch (error) {
        console.error("Vertex import failed:", error);
        setConnecting(null);
        toastStore.error(t("dashboard.toasts.connectionFailed"), String(error));
      }
      return;
    }

    // For OAuth providers, get the URL first and show modal
    setConnecting(provider);
    try {
      const urlData = await getOAuthUrl(provider);
      setOauthUrlData(urlData);
      setOauthModalProvider(provider);
      setConnecting(null);
    } catch (error) {
      console.error("Failed to get OAuth URL:", error);
      setConnecting(null);
      toastStore.error(t("dashboard.toasts.connectionFailed"), String(error));
    }
  };

  const handleDeviceCodeConnect = async (provider: Provider) => {
    if (!proxyStatus().running) {
      toastStore.warning(
        t("dashboard.toasts.startProxyFirst"),
        t("dashboard.toasts.proxyMustRunToConnectAccounts"),
      );
      return;
    }

    setConnecting(provider);
    try {
      const dcData = await getDeviceCode(provider);
      setDeviceCodeData(dcData);
      setDeviceCodeProvider(provider);
      setConnecting(null);
    } catch (error) {
      console.error("Failed to get device code:", error);
      setConnecting(null);
      toastStore.error("Device code login failed", String(error));
    }
  };

  const handleStartOAuth = async () => {
    const provider = oauthModalProvider();
    const urlData = oauthUrlData();
    if (!provider || !urlData) {
      return;
    }

    setOauthLoading(true);
    setShowManualCodeInput(false);
    setOauthCompleted(false);

    try {
      // Open the browser with the OAuth URL
      await openUrlInBrowser(urlData.url);
      toastStore.info(
        t("dashboard.toasts.connectingToProvider", {
          provider: getProviderName(provider),
        }),
        t("dashboard.toasts.completeAuthenticationInBrowser"),
      );

      // Show manual code input after 10 seconds if deep-link hasn't fired
      const manualInputTimer = setTimeout(() => {
        setShowManualCodeInput(true);
      }, 10_000);

      // Start polling for OAuth completion
      let attempts = 0;
      const maxAttempts = 120;
      const pollInterval = setInterval(async () => {
        attempts++;
        // Guard: if another path already completed this OAuth, stop polling
        if (!oauthModalProvider() || oauthCompleted()) {
          clearInterval(pollInterval);
          clearTimeout(manualInputTimer);
          return;
        }
        try {
          const completed = await pollOAuthStatus(urlData.state);
          if (completed) {
            clearInterval(pollInterval);
            clearTimeout(manualInputTimer);
            // Race guard: bail if another path (deep-link/manual) already handled this
            if (oauthCompleted()) {
              return;
            }
            setOauthCompleted(true);
            // Add delay to ensure file is written before scanning
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Get current count for this provider to detect new auth
            const currentAuth = authStatus();
            const currentCount = currentAuth[provider] || 0;

            // Retry refresh up to 3 times with delay if count doesn't increase
            let newAuth = await refreshAuthStatus();
            let retries = 0;
            while ((newAuth[provider] || 0) <= currentCount && retries < 3) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              newAuth = await refreshAuthStatus();
              retries++;
            }

            setAuthStatus(newAuth);
            setOauthLoading(false);
            setOauthModalProvider(null);
            setOauthUrlData(null);
            setRecentlyConnected((prev) => new Set([...prev, provider]));
            setTimeout(() => {
              setRecentlyConnected((prev) => {
                const next = new Set(prev);
                next.delete(provider);
                return next;
              });
            }, 2000);
            toastStore.success(
              t("dashboard.toasts.providerConnected", {
                provider: getProviderName(provider),
              }),
              t("dashboard.toasts.youCanNowUseThisProvider"),
            );
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setOauthLoading(false);
            toastStore.error(
              t("dashboard.toasts.connectionTimeout"),
              t("dashboard.toasts.pleaseTryAgain"),
            );
          }
        } catch (error) {
          console.error("Poll error:", error);
        }
      }, 1000);
      onCleanup(() => {
        clearInterval(pollInterval);
        clearTimeout(manualInputTimer);
      });
    } catch (error) {
      console.error("Failed to open OAuth:", error);
      setOauthLoading(false);
      toastStore.error(t("dashboard.toasts.connectionFailed"), String(error));
    }
  };

  const handleAlreadyAuthorized = async () => {
    const provider = oauthModalProvider();
    const urlData = oauthUrlData();
    if (!provider || !urlData || oauthCompleted()) {
      return;
    }

    setOauthLoading(true);

    // Check if auth is already complete
    try {
      const completed = await pollOAuthStatus(urlData.state);
      if (completed) {
        // Race guard: bail if another path already handled this
        if (oauthCompleted()) {
          setOauthLoading(false);
          return;
        }
        setOauthCompleted(true);

        // Add delay to ensure file is written before scanning
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Get current count for this provider to detect new auth
        const currentAuth = authStatus();
        const currentCount = currentAuth[provider] || 0;

        // Retry refresh up to 3 times with delay if count doesn't increase
        let newAuth = await refreshAuthStatus();
        let retries = 0;
        while ((newAuth[provider] || 0) <= currentCount && retries < 3) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          newAuth = await refreshAuthStatus();
          retries++;
        }

        setAuthStatus(newAuth);
        setOauthLoading(false);
        setOauthModalProvider(null);
        setOauthUrlData(null);
        setRecentlyConnected((prev) => new Set([...prev, provider]));
        setTimeout(() => {
          setRecentlyConnected((prev) => {
            const next = new Set(prev);
            next.delete(provider);
            return next;
          });
        }, 2000);
        toastStore.success(
          t("dashboard.toasts.providerConnected", {
            provider: getProviderName(provider),
          }),
          t("dashboard.toasts.youCanNowUseThisProvider"),
        );
      } else {
        setOauthLoading(false);
        toastStore.warning(
          t("dashboard.toasts.notAuthorizedYet"),
          t("dashboard.toasts.completeAuthorizationInBrowserFirst"),
        );
      }
    } catch (error) {
      console.error("Check auth error:", error);
      setOauthLoading(false);
      toastStore.error(
        t("dashboard.toasts.failedToCheckAuthorization"),
        String(error),
      );
    }
  };

  const handleCancelOAuth = () => {
    setOauthModalProvider(null);
    setOauthUrlData(null);
    setOauthLoading(false);
    setShowManualCodeInput(false);
    setOauthCompleted(false);
  };

  const handleSubmitCode = async (code: string) => {
    const provider = oauthModalProvider();
    if (!provider || oauthCompleted()) {
      return;
    }
    setOauthCompleted(true);

    setOauthLoading(true);
    try {
      const newAuth = await completeOAuth(provider, code);
      setAuthStatus(newAuth);
      setOauthLoading(false);
      setOauthModalProvider(null);
      setOauthUrlData(null);
      setShowManualCodeInput(false);
      setRecentlyConnected((prev) => new Set([...prev, provider]));
      setTimeout(() => {
        setRecentlyConnected((prev) => {
          const next = new Set(prev);
          next.delete(provider);
          return next;
        });
      }, 2000);
      toastStore.success(
        t("dashboard.toasts.providerConnected", {
          provider: getProviderName(provider),
        }),
        t("dashboard.toasts.youCanNowUseThisProvider"),
      );
    } catch (error) {
      console.error("Manual code submission failed:", error);
      setOauthLoading(false);
      setOauthCompleted(false); // Allow retry
      toastStore.error(t("dashboard.toasts.connectionFailed"), String(error));
      throw error; // Re-throw so OAuthModal can reset its submitting state
    }
  };

  const handleDisconnect = async (provider: Provider) => {
    try {
      await disconnectProvider(provider);
      const newAuth = await refreshAuthStatus();
      setAuthStatus(newAuth);
      toastStore.success(
        t("dashboard.toasts.providerDisconnected", {
          provider: getProviderName(provider),
        }),
      );
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toastStore.error(t("dashboard.toasts.failedToDisconnect"), String(error));
    }
  };

  const connectedProviders = () =>
    providers.filter((p) => authStatus()[p.provider]);
  const disconnectedProviders = () =>
    providers.filter((p) => !authStatus()[p.provider]);
  const hasAnyProvider = () => connectedProviders().length > 0;

  const handleApplyEnv = async () => {
    const result = configResult();
    if (!result?.result.shellConfig) {
      return;
    }
    try {
      const profilePath = await appendToShellProfile(result.result.shellConfig);
      toastStore.success(
        t("settings.toasts.addedToShellProfile"),
        t("settings.toasts.updatedPath", { path: profilePath }),
      );
      setConfigResult(null);
      await loadAgents();
    } catch (error) {
      toastStore.error(
        t("settings.toasts.failedToUpdateShellProfile"),
        String(error),
      );
    }
  };

  // Format helpers
  const formatCost = (n: number) => (n < 0.01 ? "<$0.01" : `$${n.toFixed(2)}`);
  const formatTokens = (n: number) => {
    if (n >= 1_000_000) {
      return `${(n / 1_000_000).toFixed(1)}M`;
    }
    if (n >= 1000) {
      return `${(n / 1000).toFixed(1)}K`;
    }
    return n.toString();
  };

  // Estimated cost calculation (same as Analytics)
  const estimatedCost = () => {
    const s = stats();
    if (!s) {
      return 0;
    }
    // Average pricing: ~$3/1M input, ~$15/1M output (blended across models)
    const inputCost = (s.inputTokens / 1_000_000) * 3;
    const outputCost = (s.outputTokens / 1_000_000) * 15;
    return inputCost + outputCost;
  };

  // Model grouping helpers
  const groupModelsByProvider = (
    models: AvailableModel[],
  ): { models: string[]; provider: string }[] => {
    const providerNames: Record<string, string> = {
      anthropic: "Claude",
      antigravity: "Gemini", // Antigravity uses Gemini models, group together
      google: "Gemini",
      iflow: "iFlow",
      openai: "OpenAI/Codex",
      qwen: "Qwen",
      vertex: "Vertex AI",
    };
    const grouped: Record<string, string[]> = {};
    for (const m of models) {
      const provider = providerNames[m.ownedBy] || m.ownedBy;
      if (!grouped[provider]) {
        grouped[provider] = [];
      }
      grouped[provider].push(m.id);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([provider, models]) => ({ models, provider }));
  };

  const getProviderColor = (provider: string): string => {
    const colors: Record<string, string> = {
      Claude: "text-orange-600 dark:text-orange-400",
      Gemini: "text-brand-600 dark:text-brand-300",
      iFlow: "text-cyan-600 dark:text-cyan-400",
      "OpenAI/Codex": "text-green-600 dark:text-green-400",
      Qwen: "text-purple-600 dark:text-purple-400",
      "Vertex AI": "text-red-600 dark:text-red-400",
    };
    return colors[provider] || "text-gray-600 dark:text-gray-400";
  };

  return (
    <div class="flex min-h-screen flex-col bg-transparent">
      <header class="border-b border-orange-100 px-6 py-5">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
              Control center
            </p>
            <h1 class="mt-2 text-3xl font-semibold text-gray-900">
              {t("sidebar.dashboard")}
            </h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Track activation, accounts, quotas, and routing health from a
              workspace designed around overview-first scanning.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button
              class="flex items-center gap-2 rounded-2xl border border-orange-100 bg-white px-4 py-2 text-sm text-gray-500 transition-colors hover:bg-orange-50 hover:text-brand-600"
              onClick={openCommandPalette}
              title={t("dashboard.commandPalette")}
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
              <span>{t("dashboard.commandPalette")}</span>
              <kbd class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium">
                ⌘K
              </kbd>
            </button>
            <StatusIndicator
              disabled={toggling()}
              onToggle={toggleProxy}
              running={proxyStatus().running}
            />
          </div>
        </div>
      </header>

      <main class="flex flex-1 flex-col overflow-y-auto p-6">
        <div class="mx-auto w-full max-w-7xl space-y-6">
          <ConnectedProvidersSection connected={connectedProviders()} />

          <div class="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_380px]">
            <div class="space-y-6">
              <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <div class="space-y-6">
                  <div class="grid gap-4 md:grid-cols-2">
                    <div class="rounded-[28px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
                      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                        Activation path
                      </p>
                      <h2 class="mt-2 text-xl font-semibold text-gray-900">
                        Get the workspace ready
                      </h2>
                      <p class="mt-2 text-sm leading-6 text-gray-500">
                        Move from initial activation to daily usage with a
                        guided checklist and clear next-step cues.
                      </p>
                    </div>
                    <div class="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm">
                      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                        Live status
                      </p>
                      <div class="mt-4 flex items-center gap-3">
                        <div
                          class={`h-3 w-3 rounded-full ${proxyStatus().running ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
                        />
                        <div>
                          <p class="text-sm font-medium text-gray-900">
                            {proxyStatus().running
                              ? t("sidebar.proxyRunning")
                              : t("sidebar.proxyStopped")}
                          </p>
                          <p class="text-xs text-gray-500">
                            {proxyStatus().endpoint}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Workspace summary
                    </p>
                    <h2 class="mt-2 text-lg font-semibold text-gray-900">
                      Operational snapshot
                    </h2>
                    <p class="mt-2 text-sm leading-6 text-gray-500">
                      Review usage, provider readiness, and route confidence
                      before diving into deeper tools.
                    </p>
                  </div>
                </div>
              </div>

              <Show
                when={
                  history().requests.length > 0 ||
                  (stats() && stats()!.totalRequests > 0)
                }
              >
                <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <KpiTile
                    icon="bolt"
                    label={t("dashboard.kpi.totalRequests")}
                    onClick={() => setCurrentPage("analytics")}
                    subtext={t("dashboard.kpi.requestsToday", {
                      count: stats()?.requestsToday || 0,
                    })}
                    value={formatTokens(
                      stats()?.totalRequests || history().requests.length,
                    )}
                  />
                  <KpiTile
                    icon="check"
                    label={t("dashboard.kpi.successRate")}
                    onClick={() => setCurrentPage("analytics")}
                    subtext={t("dashboard.kpi.failedCount", {
                      count: stats()?.failureCount || 0,
                    })}
                    value={`${stats() && stats()!.totalRequests > 0 ? Math.min(100, Math.round((stats()!.successCount / stats()!.totalRequests) * 100)) : 100}%`}
                  />
                  <KpiTile
                    icon="dollar"
                    label={t("dashboard.kpi.estimatedCost")}
                    onClick={() => setCurrentPage("analytics")}
                    subtext={t("dashboard.kpi.tokensCount", {
                      count: formatTokens(stats()?.totalTokens || 0),
                    })}
                    value={formatCost(estimatedCost())}
                  />
                </div>
              </Show>

              <div class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <div class="space-y-6">
                  <ProviderSection
                    authStatus={authStatus() as Record<Provider, number>}
                    connected={connectedProviders().map((p) => ({
                      id: p.provider,
                      logo: p.logo,
                      name: p.name,
                    }))}
                    connectingProvider={connecting()}
                    deviceCodeProviders={deviceCodeProviders}
                    disconnected={disconnectedProviders().map((p) => ({
                      id: p.provider,
                      logo: p.logo,
                      name: p.name,
                    }))}
                    onConnect={handleConnect}
                    onDeviceCodeConnect={handleDeviceCodeConnect}
                    onDisconnect={handleDisconnect}
                    proxyRunning={proxyStatus().running}
                    recentlyConnected={recentlyConnected()}
                  />

                  <div class="grid gap-6 xl:grid-cols-2">
                    <QuotaWidget authStatus={authStatus()} />
                    <CodexQuotaWidget authStatus={authStatus()} />
                    <ClaudeQuotaWidget />
                    <KiroQuotaWidget />
                  </div>
                </div>

                <div class="space-y-6">
                  <CopilotQuotaWidget />
                  <CopilotCard
                    config={config().copilot}
                    onConfigChange={handleCopilotConfigChange}
                    proxyRunning={proxyStatus().running}
                  />
                  <div class="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm">
                    <p class="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                      Access endpoint
                    </p>
                    <div class="mt-4">
                      <ApiEndpoint
                        endpoint={proxyStatus().endpoint}
                        running={proxyStatus().running}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Config Modal */}
          <Show when={configResult()}>
            <div class="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div class="animate-scale-in w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
                <div class="p-6">
                  <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {t("agentSetup.configModal.agentConfigured", {
                        agent: configResult()!.agentName,
                      })}
                    </h2>
                    <button
                      class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setConfigResult(null)}
                    >
                      <svg
                        class="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M6 18L18 6M6 6l12 12"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                        />
                      </svg>
                    </button>
                  </div>

                  <div class="space-y-4">
                    <Show when={configResult()!.result.configPath}>
                      <div class="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                        <div class="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <svg
                            class="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M5 13l4 4L19 7"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                            />
                          </svg>
                          <span class="text-sm font-medium">
                            {t("agentSetup.configModal.configFileCreated")}
                          </span>
                        </div>
                        <p class="mt-1 break-all font-mono text-xs text-green-600 dark:text-green-400">
                          {configResult()!.result.configPath}
                        </p>
                      </div>
                    </Show>

                    {/* Models configured - grouped by provider */}
                    <Show
                      when={
                        configResult()?.models &&
                        (configResult()?.models?.length ?? 0) > 0
                      }
                    >
                      <div class="space-y-2">
                        <div class="flex items-center justify-between">
                          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("dashboard.configModal.modelsConfigured")}
                          </span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">
                            {configResult()?.models?.length ?? 0}{" "}
                            {t("dashboard.configModal.total")}
                          </span>
                        </div>
                        <div class="max-h-48 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                          <For
                            each={groupModelsByProvider(
                              configResult()?.models ?? [],
                            )}
                          >
                            {(group) => (
                              <div>
                                <div class="mb-1.5 flex items-center gap-2">
                                  <span
                                    class={`text-xs font-semibold uppercase tracking-wider ${getProviderColor(group.provider)}`}
                                  >
                                    {group.provider}
                                  </span>
                                  <span class="text-xs text-gray-400">
                                    ({group.models.length})
                                  </span>
                                </div>
                                <div class="flex flex-wrap gap-1">
                                  <For each={group.models}>
                                    {(model) => (
                                      <span class="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                        {model}
                                      </span>
                                    )}
                                  </For>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    </Show>

                    <Show when={configResult()!.result.shellConfig}>
                      <div class="space-y-2">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t("agentSetup.configModal.environmentVariables")}
                        </span>
                        <pre class="overflow-x-auto whitespace-pre-wrap rounded-lg bg-gray-100 p-3 font-mono text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {configResult()!.result.shellConfig}
                        </pre>
                        <Button
                          class="w-full"
                          onClick={handleApplyEnv}
                          size="sm"
                          variant="secondary"
                        >
                          {t(
                            "agentSetup.configModal.addToShellProfileAutomatically",
                          )}
                        </Button>
                      </div>
                    </Show>

                    <div class="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900/40 dark:bg-[#2b211a]">
                      <p class="text-sm text-[#9a4a12] dark:text-orange-200">
                        {configResult()!.result.instructions}
                      </p>
                    </div>
                  </div>

                  <div class="mt-6 flex justify-end">
                    <Button
                      onClick={() => setConfigResult(null)}
                      variant="primary"
                    >
                      {t("agentSetup.configModal.done")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </main>

      {/* OAuth Modal */}
      <OAuthModal
        authUrl={oauthUrlData()?.url || ""}
        loading={oauthLoading()}
        onAlreadyAuthorized={handleAlreadyAuthorized}
        onCancel={handleCancelOAuth}
        onStartOAuth={handleStartOAuth}
        onSubmitCode={handleSubmitCode}
        provider={oauthModalProvider()}
        providerName={
          oauthModalProvider() ? getProviderName(oauthModalProvider()!) : ""
        }
        showManualInput={showManualCodeInput()}
      />

      {/* Device Code Modal */}
      <DeviceCodeModal
        deviceCode={deviceCodeData()}
        onCancel={() => {
          setDeviceCodeProvider(null);
          setDeviceCodeData(null);
        }}
        onSuccess={async () => {
          setDeviceCodeProvider(null);
          setDeviceCodeData(null);
          const newAuth = await refreshAuthStatus();
          setAuthStatus(newAuth);
        }}
        provider={deviceCodeProvider()}
        providerName={
          deviceCodeProvider() ? getProviderName(deviceCodeProvider()!) : ""
        }
      />
    </div>
  );
}
