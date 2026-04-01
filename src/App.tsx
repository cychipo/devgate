import { Match, onCleanup, onMount, Switch } from "solid-js";
import { CommandPalette } from "./components/CommandPalette";
import { Sidebar } from "./components/Sidebar";
import { ToastContainer } from "./components/ui";
import { useI18n } from "./i18n";
import {
  AnalyticsPage,
  ApiKeysPage,
  AuthFilesPage,
  DashboardPage,
  LogViewerPage,
  SettingsPage,
} from "./pages";
import { appStore } from "./stores/app";

function App() {
  const { currentPage, initialize, isInitialized, setCurrentPage } = appStore;
  const { t } = useI18n();

  onMount(() => {
    initialize();

    // Listen for navigation events from child components
    const handleNavigateToSettings = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) {
        appStore.setSettingsTab(detail.tab);
      }
      setCurrentPage("settings");
    };
    window.addEventListener("navigate-to-settings", handleNavigateToSettings);
    onCleanup(() => {
      window.removeEventListener("navigate-to-settings", handleNavigateToSettings);
    });
  });

  return (
    <>
      {!isInitialized() ? (
        <div class="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
          <div class="text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl">
              <img
                alt="DevGate Logo"
                class="h-16 w-16 rounded-2xl object-contain"
                src="/proxypal-black.png"
              />
            </div>
            <p class="text-gray-500 dark:text-gray-400">{t("app.loading")}</p>
          </div>
        </div>
      ) : (
        <div class="min-h-screen bg-[#fffaf4]">
          <Sidebar />
          <div class="pl-64">
            <div class="min-h-screen px-5 py-5">
              <div class="mx-auto max-w-[1600px] rounded-[28px] border border-orange-100 bg-white shadow-[0_20px_60px_rgba(246,131,30,0.08)]">
                <Switch fallback={<DashboardPage />}>
                  <Match when={currentPage() === "dashboard"}>
                    <DashboardPage />
                  </Match>
                  <Match when={currentPage() === "settings"}>
                    <SettingsPage />
                  </Match>
                  <Match when={currentPage() === "api-keys"}>
                    <ApiKeysPage />
                  </Match>
                  <Match when={currentPage() === "auth-files"}>
                    <AuthFilesPage />
                  </Match>
                  <Match when={currentPage() === "logs"}>
                    <LogViewerPage />
                  </Match>
                  <Match when={currentPage() === "analytics"}>
                    <AnalyticsPage />
                  </Match>
                </Switch>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
      <CommandPalette />
    </>
  );
}

export default App;
