import React, { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join } from '@tauri-apps/api/path';
import { getVersion } from '@tauri-apps/api/app';
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [bunVersion, setBunVersion] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [cloneStatus, setCloneStatus] = useState("");
  const [installStatus, setInstallStatus] = useState("");
  const [devStatus, setDevStatus] = useState("");
  const [projectName, setProjectName] = useState("partyvite-example");
  const [appVersion, setAppVersion] = useState("");
  const [iwaUrl, setIwaUrl] = useState("http://localhost:5193");

  useEffect(() => {
    // Get app version on component mount
    getVersion().then((version) => {
      setAppVersion(version);
    });
  }, []);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  async function checkBunVersion() {
    setBunVersion(await invoke("check_bun_version"));
  }

  async function runBunInstall(projectPath: string) {
    setInstallStatus(await invoke("run_bun_install", { projectPath }));
  }

  async function runBunDev(projectPath: string) {
    setDevStatus(await invoke("run_bun_dev", { projectPath }));
  }

  async function checkForUpdates() {
    try {
      await invoke("check_for_updates");
    } catch (error) {
      console.error("Error checking for updates:", error);
    }
  }

  async function launchChrome() {
    try {
      await invoke("launch_chrome");
    } catch (error) {
      console.error("Error launching Chrome:", error);
    }
  }

  async function killChrome() {
    try {
      await invoke("kill_chrome");
    } catch (error) {
      console.error("Error killing Chrome:", error);
    }
  }

  async function launchIwa() {
    try {
      await invoke("launch_iwa");
    } catch (error) {
      console.error("Error launching IWA:", error);
    }
  }

  async function killIwa() {
    try {
      await invoke("kill_iwa");
    } catch (error) {
      console.error("Error killing IWA:", error);
    }
  }

  async function cloneRepo() {
    try {
      // Get the app data directory
      const appDataDirPath = await appDataDir();
      // Create a projects subdirectory path
      const projectsPath = await join(appDataDirPath, "projects");
      
      // Extract repository name from URL to use as folder name
      const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'default-repo';
      const targetPath = await join(projectsPath, repoName);

      // Call the Rust command to clone the repository
      const result = await invoke("clone_repository", {
        url: repoUrl,
        path: targetPath,
      });
      
      setCloneStatus(`Success: ${result}`);
      setRepoUrl(""); // Clear the input
    } catch (error) {
      setCloneStatus(`Error: ${error}`);
    }
  }

  async function handleBunInstall() {
    try {
      const appDataDirPath = await appDataDir();
      const projectsPath = await join(appDataDirPath, "projects");
      const targetPath = await join(projectsPath, projectName);
      await runBunInstall(targetPath);
    } catch (error) {
      setInstallStatus(`Error: ${error}`);
    }
  }

  async function handleBunDev() {
    try {
      const appDataDirPath = await appDataDir();
      const projectsPath = await join(appDataDirPath, "projects");
      const targetPath = await join(projectsPath, projectName);
      await runBunDev(targetPath);
    } catch (error) {
      setDevStatus(`Error: ${error}`);
    }
  }

  return (
    <main className="container">
      <h1>IWA Launcher</h1>

      {/* Version and Updates Section */}
      <div className="section">
        <div className="version-info">Version: {appVersion}</div>
        <button onClick={checkForUpdates}>Check for Updates</button>
      </div>

      {/* Chrome Management Section */}
      <div className="section">
        <h2>Chrome Management</h2>
        <div className="button-group">
          <button onClick={launchChrome}>Launch Chrome + install IWA</button>
          <button onClick={killChrome}>Kill Chrome</button>
        </div>
      </div>

      {/* IWA Management Section */}
      <div className="section">
        <h2>IWA Management</h2>
        <div className="button-group">
          <button onClick={launchIwa}>Launch IWA</button>
          <button onClick={killIwa}>Kill IWA</button>
        </div>
      </div>

      {/* IWA Installation Section - Currently Disabled */}
      <div className="section disabled">
        <h2>IWA Installation</h2>
        <div className="input-group">
          <label htmlFor="iwa-url">Install Isolated Web App From URL</label>
          <input
            type="text"
            id="iwa-url"
            value={iwaUrl}
            onChange={(e) => setIwaUrl(e.target.value)}
            placeholder="Enter URL"
          />
          <button disabled>Install IWA from URL</button>
        </div>
        
        <div className="input-group">
          <label htmlFor="iwa-file">Install Isolated Web App From File</label>
          <input
            type="file"
            id="iwa-file"
            accept=".swbn,.wbn"
            disabled
          />
          <button disabled>Install IWA from File</button>
        </div>
      </div>

      {/* Development Tools Section */}
      <div className="section">
        <h2>Development Tools</h2>
        
        <div className="subsection">
          <h3>Bun Version Check</h3>
          <div className="button-group">
            <button onClick={checkBunVersion}>Check Bun Version</button>
          </div>
          {bunVersion && <p className="status-text">Bun Version: {bunVersion}</p>}
        </div>

        <div className="subsection">
          <h3>Repository Management</h3>
          <div className="input-group">
            <input
              id="repo-url"
              onChange={(e) => setRepoUrl(e.currentTarget.value)}
              placeholder="Enter repository URL"
              value={repoUrl}
            />
            <button onClick={(e) => { e.preventDefault(); cloneRepo(); }}>
              Clone Repository
            </button>
          </div>
          {cloneStatus && (
            <p className={`status-text ${cloneStatus.includes('Error') ? 'error' : 'success'}`}>
              {cloneStatus}
            </p>
          )}
        </div>
        
        <div className="subsection">
          <h3>Project Management</h3>
          <div className="input-group">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.currentTarget.value)}
              placeholder="Project name"
            />
          </div>
          <div className="button-group">
            <button onClick={handleBunInstall}>Run bun install</button>
            <button onClick={handleBunDev}>Run bun dev</button>
          </div>
          {installStatus && (
            <p className={`status-text ${installStatus.includes('Error') ? 'error' : 'success'}`}>
              {installStatus}
            </p>
          )}
          {devStatus && (
            <p className={`status-text ${devStatus.includes('Error') ? 'error' : 'success'}`}>
              {devStatus}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
