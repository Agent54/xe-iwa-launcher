import { checkForAppUpdates } from "./updater.js";

document.getElementById("check-for-updates").addEventListener("click", async () => {
  console.log("checking for updates");
  await checkForAppUpdates();
});
