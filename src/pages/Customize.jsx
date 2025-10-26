import React, { useState, useEffect } from "react";
import ApiKeyPrompt from "../components/ApiKeyPrompt";
import TokenValidationPrompt from "../components/TokenValidationPrompt";
import LoadingScreen from "../components/LoadingScreen";
import Preview from "../components/Preview";
import ElementList from "../components/Customize/ElementList";
import ElementEditor from "../components/Customize/ElementEditor";
import SettingsPanel from "../components/Customize/SettingsPanel";
import {
  getTwitchApiKey,
  getTwitchClientId,
  getOverlayConfig,
  setPreviewConfig,
  applyPreviewConfig,
  getPreviewConfig,
  resetToDefault,
  saveAsUserDefault,
  resetToFactoryDefault,
  resetToUserDefault,
} from "../config";
import { validateToken, getFollowerCount, getSubscriberCount, updateConfig } from "../api";
import { migrateOldConfig } from "../utils/elementRenderer.jsx";
import "../styles/Customize.css";

export default function Customize() {
  // Auth state
  const [authState, setAuthState] = useState("loading");
  const [tokenValidation, setTokenValidation] = useState(null);

  // Config
  const [config, setConfig] = useState(null);
  const [previewConfig, setPreviewConfigState] = useState(null);

  // UI state
  const [selectedElement, setSelectedElement] = useState(null);
  const [activeTab, setActiveTab] = useState("elements");
  const [previewStep, setPreviewStep] = useState(0);

  // Emotes / OBS URL
  const [availableEmotes, setAvailableEmotes] = useState([]);
  const [obsUrl, setObsUrl] = useState("");
  const [showObsUrl, setShowObsUrl] = useState(false);

  // Real data for nice preview
  const [realTwitchData, setRealTwitchData] = useState({ followers: { current: 0 }, subscribers: { current: 0 } });
  const [loadingTwitchData, setLoadingTwitchData] = useState(false);
  const [youtubeData, setYoutubeData] = useState({
    latest: { text: "Latest YouTube Video", subtext: "Preview mode", thumbnail: null },
  });
  const [loadingYoutubeData, setLoadingYoutubeData] = useState(false);

  // Basic authentication check
  useEffect(() => {
    const authenticate = async () => {
      try {
        const apiKey = getTwitchApiKey();
        const clientId = getTwitchClientId();
        if (!apiKey || !clientId) {
          setAuthState("needs-auth");
          return;
        }
        const validation = await validateToken();
        if (validation?.valid) setAuthState("authenticated");
        else {
          setTokenValidation(validation);
          setAuthState("error");
        }
      } catch (err) {
        console.error("Auth error", err);
        setAuthState("error");
      }
    };
    authenticate();
  }, []);

  // Load config & emotes
  useEffect(() => {
    const load = async () => {
      const overlayConfig = migrateOldConfig(getOverlayConfig() || {});
      setConfig(overlayConfig);
      const preview = getPreviewConfig();
      setPreviewConfigState(preview ? migrateOldConfig(preview) : JSON.parse(JSON.stringify(overlayConfig)));
      await loadAvailableEmotes();
    };
    load();
  }, []);

  const loadAvailableEmotes = async () => {
    try {
      const res = await fetch("/api/emotes");
      const data = await res.json();
      setAvailableEmotes(Array.isArray(data) ? data.map((e) => e.filename) : []);
    } catch (err) {
      console.error("Failed to load emotes", err);
      setAvailableEmotes([]);
    }
  };

  // Minimal real data fetchers used in preview (non-blocking)
  useEffect(() => {
    if (authState !== "authenticated") return;
    const fetchReal = async () => {
      setLoadingTwitchData(true);
      try {
        const [followers, subscribers] = await Promise.all([getFollowerCount(), getSubscriberCount()]);
        setRealTwitchData({ followers: { current: followers }, subscribers: { current: subscribers } });
      } catch (err) {
        console.warn("Could not fetch real Twitch data", err);
      } finally {
        setLoadingTwitchData(false);
      }
    };
    fetchReal();
  }, [authState]);

  // Helpers to update preview config
  const setPreviewConfig = (newConfig) => {
    try {
      setPreviewConfigState(newConfig);
      // persist to local storage via config helper
      setPreviewConfig(newConfig);
    } catch (e) {
      // ignore
    }
  };

  const getEnabledSteps = () => {
    if (!previewConfig) return [];
    const steps = [];
    const elements = Array.isArray(previewConfig.elements) ? previewConfig.elements : [];
    elements.forEach((element) => {
      if (!element.enabled) return;
      if (element.type === "list" && element.fields?.showAsCarousel) {
        const items = element.fields?.items || [];
        const maxItems = element.fields?.maxItemsToShow || items.length;
        items
          .slice(0, maxItems)
          .forEach((item, index) =>
            steps.push({ type: "carouselItem", elementId: element.id, element, itemIndex: index, item })
          );
      } else {
        steps.push({ type: "element", elementId: element.id, element });
      }
    });
    return steps.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  };

  const updatePreviewElement = (elementId, updates) => {
    if (!previewConfig) return;
    const elements = Array.isArray(previewConfig.elements) ? [...previewConfig.elements] : [];
    const idx = elements.findIndex((el) => el.id === elementId);
    if (idx === -1) return;
    elements[idx] = { ...elements[idx], ...updates };
    const newConfig = { ...previewConfig, elements };
    setPreviewConfigState(newConfig);
    try {
      setPreviewConfig(newConfig);
    } catch (e) {}
  };

  const addNewElement = () => {
    if (!previewConfig) return;
    const elements = Array.isArray(previewConfig.elements) ? [...previewConfig.elements] : [];
    const newId = `custom_${Date.now()}`;
    elements.push({
      id: newId,
      type: "info",
      enabled: true,
      title: "New Element",
      emote: "⭐",
      zIndex: elements.length + 1,
      fields: { text: "Custom text", subtext: "" },
    });
    const newConfig = { ...previewConfig, elements };
    setPreviewConfigState(newConfig);
    try {
      setPreviewConfig(newConfig);
    } catch (e) {}
    setSelectedElement(newId);
  };

  const duplicateElement = (elementId) => {
    if (!previewConfig || !elementId) return;
    const elements = Array.isArray(previewConfig.elements) ? [...previewConfig.elements] : [];
    const idx = elements.findIndex((el) => el.id === elementId);
    if (idx === -1) return;
    const original = elements[idx];
    // Deep clone the element
    const clone = JSON.parse(JSON.stringify(original));
    const newId = `${original.id}_copy_${Date.now().toString(36)}`;
    clone.id = newId;
    clone.title = clone.title ? `Copy of ${clone.title}` : `Copy ${newId}`;
    // Ensure zIndex places it at the end
    clone.zIndex = (elements.length || 0) + 1;
    // Insert right after original
    elements.splice(idx + 1, 0, clone);
    const newConfig = { ...previewConfig, elements };
    setPreviewConfigState(newConfig);
    try {
      setPreviewConfig(newConfig);
    } catch (e) {}
    setSelectedElement(newId);
  };

  const deleteElement = (elementId) => {
    if (!previewConfig) return;
    if (!confirm("Are you sure you want to delete this element?")) return;
    const elements = (previewConfig.elements || []).filter((el) => el.id !== elementId);
    const newConfig = { ...previewConfig, elements };
    setPreviewConfigState(newConfig);
    try {
      setPreviewConfig(newConfig);
    } catch (e) {}
    if (selectedElement === elementId) setSelectedElement(null);
  };

  const updatePreviewGlobal = (updates) => {
    if (!previewConfig) return;
    const newConfig = { ...previewConfig, ...updates };
    setPreviewConfigState(newConfig);
    try {
      setPreviewConfig(newConfig);
    } catch (e) {}
  };

  const updateListItem = (elementId, itemIndex, updates) => {
    if (!previewConfig) return;
    const elements = previewConfig.elements || [];
    const el = elements.find((e) => e.id === elementId);
    if (!el) return;
    const newItems = [...(el.fields?.items || [])];
    newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
    updatePreviewElement(elementId, { fields: { ...el.fields, items: newItems } });
  };

  const addListItem = (elementId) => {
    const el = (previewConfig.elements || []).find((e) => e.id === elementId);
    if (!el) return;
    const newItems = [...(el.fields?.items || []), { name: "!new", description: "New item", emote: "💬" }];
    updatePreviewElement(elementId, { fields: { ...el.fields, items: newItems } });
  };

  const deleteListItem = (elementId, index) => {
    const el = (previewConfig.elements || []).find((e) => e.id === elementId);
    if (!el) return;
    const newItems = (el.fields?.items || []).filter((_, i) => i !== index);
    updatePreviewElement(elementId, { fields: { ...el.fields, items: newItems } });
  };

  const handleEmoteUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const valid = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    for (const f of files) {
      if (!valid.includes(f.type)) continue;
      if (f.size > 5 * 1024 * 1024) continue;
      try {
        const base64 = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = (ev) => res(ev.target.result);
          reader.onerror = rej;
          reader.readAsDataURL(f);
        });
        await fetch("/api/emotes/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: f.name, data: base64 }),
        });
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    await loadAvailableEmotes();
    e.target.value = "";
  };

  const handleDeleteEmote = async (filename) => {
    if (!confirm(`Delete emote "${filename}"?`)) return;
    try {
      await fetch(`/api/emotes/${encodeURIComponent(filename)}`, { method: "DELETE" });
      await loadAvailableEmotes();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleApplyChanges = async () => {
    try {
      applyPreviewConfig();
      setConfig(previewConfig);
      await updateConfig(previewConfig);
      alert("✅ Changes applied and sent to Display page!");
    } catch (err) {
      console.warn("Apply failed (server may be offline)", err);
      alert("Changes applied locally. Could not sync to server.");
    }
  };

  const handleSaveAsDefault = async () => {
    if (!confirm("Save current configuration as your default?")) return;
    const ok = await saveAsUserDefault(previewConfig);
    if (ok) alert("Saved as your default");
    else alert("Failed to save default");
  };

  const handleResetToFactoryDefault = async () => {
    if (!confirm("Reset to factory default?")) return;
    const ok = await resetToFactoryDefault();
    if (ok) {
      const newConfig = getOverlayConfig();
      setConfig(newConfig);
      setPreviewConfigState(JSON.parse(JSON.stringify(newConfig)));
      alert("Reset to factory defaults");
    } else alert("Failed to reset factory default");
  };

  const handleResetToUserDefault = async () => {
    if (!confirm("Reset to your saved default?")) return;
    const ok = await resetToUserDefault();
    if (ok) {
      const newConfig = getOverlayConfig();
      setConfig(newConfig);
      setPreviewConfigState(JSON.parse(JSON.stringify(newConfig)));
      alert("Reset to your default");
    } else alert("Failed to reset to user default");
  };

  const generateObsUrl = async () => {
    try {
      const clientId = getTwitchClientId();
      const apiKey = getTwitchApiKey();
      const res = await fetch("/api/auth/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, apiKey }),
      });
      const data = await res.json();
      // Use the URL returned by the server. When OBS and the server/WS run
      // on the same machine, the overlay can authenticate over the WebSocket
      // using the token and receive the clientId/apiKey there — no need to
      // append client_id to the URL.
      setObsUrl(data.obsUrl || "");
      setShowObsUrl(true);
    } catch (err) {
      console.error("Failed to generate OBS url", err);
      alert("Could not generate OBS URL");
    }
  };

  const copyObsUrl = () => {
    if (!obsUrl) return;
    navigator.clipboard.writeText(obsUrl);
    alert("Copied OBS URL to clipboard");
  };

  const handleNextStep = () => {
    const steps = getEnabledSteps();
    if (!steps.length) return;
    const next = (previewStep + 1) % steps.length;
    setPreviewStep(next);
  };
  const handlePrevStep = () => {
    const steps = getEnabledSteps();
    if (!steps.length) return;
    const prev = (previewStep - 1 + steps.length) % steps.length;
    setPreviewStep(prev);
  };

  // When user selects an element in the list, sync the preview so the selected
  // element is visible in the preview. This keeps preview navigation (arrows)
  // separate from editor selection: arrow navigation will not change the
  // selected editor element.
  useEffect(() => {
    if (!previewConfig || !selectedElement) return;
    const steps = getEnabledSteps();
    const idx = steps.findIndex((s) => s.elementId === selectedElement);
    if (idx !== -1) setPreviewStep(idx);
  }, [selectedElement, previewConfig]);

  // Clamp previewStep when the available steps change (e.g. element removed)
  useEffect(() => {
    if (!previewConfig) return;
    const steps = getEnabledSteps();
    if (steps.length === 0) {
      setPreviewStep(0);
      return;
    }
    if (previewStep >= steps.length) setPreviewStep(0);
  }, [previewConfig, previewStep]);

  if (authState === "loading") return <LoadingScreen message="Authenticating..." />;
  if (authState === "error")
    return <TokenValidationPrompt validationResult={tokenValidation} onRetry={() => window.location.reload()} />;
  if (authState === "needs-auth") return <ApiKeyPrompt onComplete={() => window.location.reload()} />;
  if (!config || !previewConfig) return <LoadingScreen message="Loading configuration..." />;

  const enabledSteps = getEnabledSteps();
  const currentStep = enabledSteps[previewStep] || null;

  // Minimal preview data passed to Preview component
  const previewData = {
    followers: { current: realTwitchData.followers.current || 847 },
    subscribers: { current: realTwitchData.subscribers.current || 123 },
    donations: { total: 1250 },
  };

  // currently selected element object (safe lookup)
  const selectedEl = previewConfig?.elements?.find((el) => el.id === selectedElement);

  return (
    <div className="customize-container">
      <div className="customize-sidebar">
        <h1>Customize Overlay</h1>

        <div className="tabs">
          <button className={activeTab === "elements" ? "active" : ""} onClick={() => setActiveTab("elements")}>
            Elements
          </button>
          <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
            Settings
          </button>
        </div>

        {activeTab === "elements" && (
          <>
            <ElementList
              elements={previewConfig.elements || []}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
              updatePreviewElement={updatePreviewElement}
              deleteElement={deleteElement}
              addNewElement={addNewElement}
              duplicateElement={duplicateElement}
            />
            {selectedEl ? (
              <ElementEditor
                element={selectedEl}
                updatePreviewElement={updatePreviewElement}
                availableEmotes={availableEmotes}
                updateListItem={updateListItem}
                addListItem={addListItem}
                deleteListItem={deleteListItem}
                loadAvailableEmotes={loadAvailableEmotes}
                handleEmoteUpload={handleEmoteUpload}
                handleDeleteEmote={handleDeleteEmote}
                updatePreviewGlobal={updatePreviewGlobal}
              />
            ) : (
              <div className="no-selection">Select an element to edit</div>
            )}
          </>
        )}

        {activeTab === "settings" && (
          <SettingsPanel
            previewConfig={previewConfig}
            updatePreviewGlobal={updatePreviewGlobal}
            availableEmotes={availableEmotes}
            handleEmoteUpload={handleEmoteUpload}
            handleDeleteEmote={handleDeleteEmote}
            loadAvailableEmotes={loadAvailableEmotes}
          />
        )}

        <div className="action-buttons">
          <button className="apply-btn" onClick={handleApplyChanges}>
            Apply Changes
          </button>

          <div className="button-group">
            <button className="save-default-btn" onClick={handleSaveAsDefault}>
              💾 Save as My Default
            </button>
            <button className="reset-btn" onClick={handleResetToUserDefault}>
              ↩️ Reset to My Default
            </button>
          </div>

          <button className="reset-factory-btn" onClick={handleResetToFactoryDefault}>
            🏭 Reset to Factory Default
          </button>

          <div className="obs-url-section">
            <button className="obs-url-btn" onClick={generateObsUrl}>
              🔗 Generate OBS URL
            </button>
            {showObsUrl && (
              <div className="obs-url-display">
                <label>OBS Browser Source URL:</label>
                <div className="url-container">
                  <input type="text" value={obsUrl} readOnly onClick={(e) => e.target.select()} />
                  <button className="copy-btn" onClick={copyObsUrl}>
                    📋 Copy
                  </button>
                </div>
                <small>
                  ✅ Use this URL in OBS Browser Source. It contains authentication and will auto-refresh when you apply
                  changes!
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      <Preview
        previewStep={previewStep}
        enabledSteps={enabledSteps}
        currentStep={currentStep}
        previewData={previewData}
        previewConfig={previewConfig}
        youtubeData={youtubeData}
        onNextStep={handleNextStep}
        onPrevStep={handlePrevStep}
      />
    </div>
  );
}
