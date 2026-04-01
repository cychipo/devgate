import { type Component, createSignal, For, onMount, Show } from "solid-js";
import { useI18n } from "../i18n";
import { checkForUpdates, downloadAndInstallUpdate } from "../lib/tauri";
import { appStore } from "../stores/app";
import { toastStore } from "../stores/toast";

type PageId = "dashboard" | "analytics" | "logs" | "api-keys" | "auth-files" | "settings";

interface NavItem {
  icon: Component<{ class?: string }>;
  id: PageId;
}

// Minimal icon components
const DashboardIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path d="M9 22V12h6v10" />
  </svg>
);

const AnalyticsIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
    <path d="M18 20V10" />
    <path d="M12 20V4" />
    <path d="M6 20v-6" />
  </svg>
);

const LogsIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

const SettingsIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const ApiKeysIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const AuthFilesIcon: Component<{ class?: string }> = (props) => (
  <svg class={props.class} fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const navItems: NavItem[] = [
  { icon: DashboardIcon, id: "dashboard" },
  { icon: ApiKeysIcon, id: "api-keys" },
  { icon: AuthFilesIcon, id: "auth-files" },
  { icon: LogsIcon, id: "logs" },
  { icon: AnalyticsIcon, id: "analytics" },
  { icon: SettingsIcon, id: "settings" },
];

export const Sidebar: Component = () => {
  const { t } = useI18n();
  const { currentPage, proxyStatus, setCurrentPage } = appStore;

  const [updateAvailable, setUpdateAvailable] = createSignal(false);
  const [updateVersion, setUpdateVersion] = createSignal("");
  const [isUpdating, setIsUpdating] = createSignal(false);

  // Check for updates on mount
  onMount(async () => {
    try {
      const info = await checkForUpdates();
      if (info.available && info.version) {
        setUpdateAvailable(true);
        setUpdateVersion(info.version);
      }
    } catch {
      // Silently ignore update check errors
    }
  });

  const handleUpdate = async () => {
    if (isUpdating()) {
      return;
    }
    setIsUpdating(true);
    try {
      await downloadAndInstallUpdate();
    } catch (error) {
      console.error("Update failed:", error);
      toastStore.error(t("settings.toasts.updateFailed"), String(error));
      setIsUpdating(false);
    }
  };

  const isActive = (id: PageId) => {
    const page = currentPage();
    return page === id;
  };

  const getNavLabel = (id: PageId) => {
    switch (id) {
      case "dashboard":
        return t("sidebar.dashboard");
      case "api-keys":
        return t("sidebar.apiKeys");
      case "auth-files":
        return t("sidebar.authFiles");
      case "logs":
        return t("sidebar.logs");
      case "analytics":
        return t("sidebar.analytics");
      case "settings":
        return t("sidebar.settings");
      default:
        return id;
    }
  };

  return (
    <aside class="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-[#fffaf4] px-4 py-4">
      <div class="flex h-full flex-col rounded-[28px] border border-orange-100 bg-white px-3 py-4 shadow-[0_16px_40px_rgba(246,131,30,0.08)]">
        <div class="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-3">
          <div class="flex items-center gap-3">
            <img alt="DevGate" class="h-10 w-10 rounded-xl object-contain shadow-sm" src="/proxypal-black.png" />
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Workspace</p>
              <p class="text-base font-semibold text-gray-900">DevGate</p>
            </div>
          </div>
          <div
            class="mt-3 flex items-center gap-2 rounded-xl px-3 py-2"
            classList={{
              "bg-gray-100": !proxyStatus().running,
              "bg-green-50": proxyStatus().running,
            }}
          >
            <div
              class="h-2 w-2 rounded-full"
              classList={{
                "bg-gray-400": !proxyStatus().running,
                "bg-green-500 animate-pulse": proxyStatus().running,
              }}
            />
            <span
              class="text-xs font-medium"
              classList={{
                "text-gray-500": !proxyStatus().running,
                "text-green-700": proxyStatus().running,
              }}
            >
              {proxyStatus().running ? t("sidebar.proxyRunning") : t("sidebar.proxyStopped")}
            </span>
          </div>
        </div>

        <div class="mt-4 px-2">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Navigation</p>
        </div>

        <nav class="mt-2 flex-1 space-y-1.5">
          <For each={navItems}>
            {(item) => (
              <button
                class="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all"
                classList={{
                  "border border-orange-100 bg-orange-50 text-brand-600 shadow-sm": isActive(item.id),
                  "border border-transparent text-gray-600 hover:border-orange-100 hover:bg-orange-50/60 hover:text-gray-900":
                    !isActive(item.id),
                }}
                onClick={() => setCurrentPage(item.id)}
                type="button"
              >
                <span
                  class="flex h-9 w-9 items-center justify-center rounded-xl"
                  classList={{
                    "bg-white text-brand-600": isActive(item.id),
                    "bg-gray-100 text-gray-500": !isActive(item.id),
                  }}
                >
                  <item.icon class="h-4 w-4 flex-shrink-0" />
                </span>
                <div class="min-w-0">
                  <span class="block whitespace-nowrap text-sm font-medium">{getNavLabel(item.id)}</span>
                </div>
              </button>
            )}
          </For>
        </nav>

        <Show when={updateAvailable()}>
          <div class="mt-4 rounded-2xl border border-green-100 bg-green-50 p-3 text-green-700">
            <div class="flex items-center gap-2">
              <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
              </svg>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-green-600">Update</p>
                <p class="truncate text-sm font-medium">
                  {isUpdating() ? t("sidebar.updating") : t("sidebar.updateTo", { version: updateVersion() })}
                </p>
              </div>
            </div>
            <button
              class="mt-3 w-full rounded-xl bg-white px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
              disabled={isUpdating()}
              onClick={handleUpdate}
              type="button"
            >
              {isUpdating() ? t("sidebar.updating") : "Install update"}
            </button>
          </div>
        </Show>
      </div>
    </aside>
  );
};
