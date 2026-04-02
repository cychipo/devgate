import { createSignal, For, Show } from "solid-js";
import {
  ClaudeKeysTab,
  CodexKeysTab,
  GeminiKeysTab,
  OpenAICompatibleTab,
  VertexKeysTab,
} from "../components/api-keys";
import { Button } from "../components/ui";
import { useI18n } from "../i18n";
import { appStore } from "../stores/app";

type TabId = "gemini" | "claude" | "codex" | "openai-compatible" | "vertex";

interface Tab {
  icon: string;
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { icon: "/logos/gemini.svg", id: "gemini", label: "Gemini" },
  { icon: "/logos/claude.svg", id: "claude", label: "Claude" },
  { icon: "/logos/openai.svg", id: "codex", label: "Codex" },
  { icon: "/logos/openai.svg", id: "openai-compatible", label: "OpenAI" },
  { icon: "/logos/vertex.svg", id: "vertex", label: "Vertex" },
];

export function ApiKeysPage() {
  const { t } = useI18n();
  const { proxyStatus, setCurrentPage } = appStore;
  const [activeTab, setActiveTab] = createSignal<TabId>("gemini");
  const [loading, setLoading] = createSignal(false);
  const [showAddForm, setShowAddForm] = createSignal(false);

  return (
    <div class="flex min-h-screen flex-col bg-transparent">
      <header class="border-b border-orange-100 px-6 py-5">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="flex items-start gap-3">
            <Button onClick={() => setCurrentPage("settings")} size="sm" variant="ghost">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </Button>
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Access workspace</p>
              <h1 class="mt-2 text-2xl font-semibold text-gray-900">{t("apiKeys.title")}</h1>
              <p class="mt-1 max-w-2xl text-sm leading-6 text-gray-500">{t("apiKeys.description")}</p>
            </div>
          </div>
          <Show when={loading()}>
            <span class="ml-2 flex items-center gap-1 text-xs text-gray-400">
              <svg class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
              </svg>
              {t("common.loading")}
            </span>
          </Show>
        </div>
      </header>

      <main class="flex flex-1 flex-col overflow-y-auto p-6">
        <div class="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div class="space-y-4">
            <div class="rounded-[24px] border border-orange-100 bg-orange-50 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Workspace map</p>
              <h2 class="mt-2 text-lg font-semibold text-gray-900">Provider categories</h2>
              <p class="mt-1 text-sm leading-6 text-gray-500">Choose a provider family to manage credentials, health, and model availability.</p>
            </div>
            <div class="flex flex-col gap-2 rounded-[24px] border border-orange-100 bg-white p-3 shadow-sm">
              <For each={TABS}>
                {(tab) => (
                  <button
                    class={`flex items-center justify-start gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
                      activeTab() === tab.id
                        ? "border border-orange-100 bg-orange-50 text-gray-900 shadow-sm"
                        : "text-gray-600 hover:bg-orange-50 hover:text-brand-600"
                    }`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setShowAddForm(false);
                    }}
                    type="button"
                  >
                    <img alt="" class="h-4 w-4" src={tab.icon} />
                    <span class="hidden sm:inline">{tab.label}</span>
                  </button>
                )}
              </For>
            </div>
          </div>

          <div class="space-y-6">
            <Show when={!proxyStatus().running}>
              <div class="rounded-[24px] border border-yellow-200 bg-yellow-50 p-4">
                <div class="flex items-center gap-3">
                  <svg class="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
                  </svg>
                  <div>
                    <p class="text-sm font-medium text-yellow-800">{t("apiKeys.proxyNotRunning")}</p>
                    <p class="mt-0.5 text-xs text-yellow-600">{t("apiKeys.startProxyServerDescription")}</p>
                  </div>
                </div>
              </div>
            </Show>

            <div class="rounded-[28px] border border-orange-100 bg-white p-4 shadow-sm sm:p-6">
              <Show when={activeTab() === "gemini"}>
                <GeminiKeysTab loading={loading} setLoading={setLoading} setShowAddForm={setShowAddForm} showAddForm={showAddForm} />
              </Show>

              <Show when={activeTab() === "claude"}>
                <ClaudeKeysTab loading={loading} setLoading={setLoading} setShowAddForm={setShowAddForm} showAddForm={showAddForm} />
              </Show>

              <Show when={activeTab() === "codex"}>
                <CodexKeysTab loading={loading} setLoading={setLoading} setShowAddForm={setShowAddForm} showAddForm={showAddForm} />
              </Show>

              <Show when={activeTab() === "vertex"}>
                <VertexKeysTab loading={loading} setLoading={setLoading} setShowAddForm={setShowAddForm} showAddForm={showAddForm} />
              </Show>

              <Show when={activeTab() === "openai-compatible"}>
                <OpenAICompatibleTab loading={loading} setLoading={setLoading} setShowAddForm={setShowAddForm} showAddForm={showAddForm} />
              </Show>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
