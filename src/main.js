import { checkForAppUpdates } from "./updater.js";

document.getElementById("check-for-updates").addEventListener("click", async () => {
  console.log("checking for updates");
  await checkForAppUpdates();
});

window.__TAURI__.app.getVersion().then((version) => {
  document.getElementById("version").textContent = version;
});
