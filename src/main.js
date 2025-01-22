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

document.getElementById("kill-chrome").addEventListener("click", async () => {
  console.log("killing chrome");
  const invoke = window.__TAURI__.core.invoke;
  invoke('kill_chrome');
});


document.getElementById("launch-iwa").addEventListener("click", async () => {
  console.log("launching iwa");
  const invoke = window.__TAURI__.core.invoke;
  invoke('launch_iwa');
});

document.getElementById("kill-iwa").addEventListener("click", async () => {
  console.log("killing iwa");
  const invoke = window.__TAURI__.core.invoke;
  invoke('kill_iwa');
});
