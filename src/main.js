import { checkForAppUpdates } from "./updater.js";

document.getElementById("check-for-updates").addEventListener("click", async () => {
  console.log("checking for updates");
  await checkForAppUpdates();
});

window.__TAURI__.app.getVersion().then((version) => {
  document.getElementById("version").textContent = version;
});

document.getElementById("launch-chrome").addEventListener("click", async () => {
  console.log("launching chrome");
  const invoke = window.__TAURI__.core.invoke;
  invoke('launch_chrome');
});
