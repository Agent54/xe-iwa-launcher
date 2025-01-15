const check = window.__TAURI__.updater.check;
const ask = window.__TAURI__.dialog.ask;
const message = window.__TAURI__.dialog.message;
const relaunch = window.__TAURI__.process.relaunch;

export async function checkForAppUpdates() {
  const update = await check();

  if (update?.available) {
    const yes = await ask(
      `
Update to ${update.version} is available!
Release notes: ${update.body}
        `,
      {
        title: "Update Now!",
        kind: "info",
        okLabel: "Update",
        cancelLabel: "Cancel",
      }
    );

    if (yes) {
      await update.downloadAndInstall();
      await relaunch();
    }
  } else {
    message("No updates available");
  }
}
