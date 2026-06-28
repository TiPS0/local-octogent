import { Check, ChevronDown, ChevronUp, FileText, Loader, Upload } from "lucide-react";
import { type DragEvent, useCallback, useEffect, useRef, useState } from "react";

import {
  buildDeckVaultFileUrl,
  buildDeckVaultFileWriteUrl,
} from "../../runtime/runtimeEndpoints";

const OCTOBOSS_ID = "__octoboss__";

type KnowledgeTab = "briefing" | "prompt" | "todo" | "files";

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ─── Vault file fetch/save helpers ─────────────────────────────────────────

const fetchVaultFile = async (fileName: string): Promise<string | null> => {
  try {
    const res = await fetch(buildDeckVaultFileUrl(OCTOBOSS_ID, fileName));
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
};

const saveVaultFile = async (fileName: string, content: string): Promise<boolean> => {
  try {
    const res = await fetch(buildDeckVaultFileWriteUrl(OCTOBOSS_ID, fileName), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

// ─── Single-file editor pane ─────────────────────────────────────────────────

type FileEditorProps = {
  fileName: string;
  placeholder: string;
  label: string;
  hint?: string;
};

const FileEditor = ({ fileName, placeholder, label, hint }: FileEditorProps) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchVaultFile(fileName).then((text) => {
      if (text !== null) setContent(text);
      setIsLoading(false);
    });
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [fileName]);

  const handleSave = useCallback(async () => {
    if (saveStatus === "saving") return;
    setSaveStatus("saving");
    const ok = await saveVaultFile(fileName, content);
    setSaveStatus(ok ? "saved" : "error");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2500);
  }, [content, fileName, saveStatus]);

  return (
    <div className="ob-editor">
      <div className="ob-editor-header">
        <span className="ob-editor-label">{label}</span>
        <span className="ob-editor-filename">{fileName}</span>
      </div>
      {hint && <p className="ob-editor-hint">{hint}</p>}
      {isLoading ? (
        <div className="ob-editor-loading">
          <Loader size={14} className="ob-spin" />
          <span>Loading…</span>
        </div>
      ) : (
        <textarea
          className="ob-editor-textarea"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setSaveStatus("idle");
          }}
          placeholder={placeholder}
          spellCheck={false}
        />
      )}
      <div className="ob-editor-footer">
        <button
          type="button"
          className={`ob-save-btn ob-save-btn--${saveStatus}`}
          onClick={() => void handleSave()}
          disabled={isLoading || saveStatus === "saving"}
        >
          {saveStatus === "saving" && <Loader size={12} className="ob-spin" />}
          {saveStatus === "saved" && <Check size={12} />}
          {saveStatus === "error" && <span>!</span>}
          {saveStatus === "idle" && null}
          <span>
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "saved"
                ? "Saved"
                : saveStatus === "error"
                  ? "Error — retry?"
                  : "Save"}
          </span>
        </button>
      </div>
    </div>
  );
};

// ─── Files upload tab ────────────────────────────────────────────────────────

type UploadedFile = {
  name: string;
  savedName: string;
  status: "saved" | "error";
};

const FilesUploadPane = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [vaultFiles, setVaultFiles] = useState<string[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshVaultList = useCallback(async () => {
    setIsLoadingVault(true);
    try {
      const res = await fetch(
        `/api/deck/tentacles/${encodeURIComponent(OCTOBOSS_ID)}/files/CONTEXT.md`,
      );
      // Fetch the tentacle summary to get vault file list
      const summaryRes = await fetch(`/api/deck/tentacles`);
      if (summaryRes.ok) {
        const tentacles = (await summaryRes.json()) as Array<{
          tentacleId: string;
          vaultFiles?: string[];
        }>;
        const boss = tentacles.find((t) => t.tentacleId === OCTOBOSS_ID);
        const systemFiles = new Set(["CONTEXT.md", "todo.md"]);
        setVaultFiles((boss?.vaultFiles ?? []).filter((f) => !systemFiles.has(f)));
      }
      void res; // intentional — we just triggered the fetch for side-effect of checking availability
    } catch {
      // silent
    }
    setIsLoadingVault(false);
  }, []);

  useEffect(() => {
    void refreshVaultList();
  }, [refreshVaultList]);

  const processFile = useCallback(
    async (file: File) => {
      const isMarkdown = file.name.endsWith(".md");
      const isText = file.name.endsWith(".txt");
      if (!isMarkdown && !isText) return;

      const savedName = isMarkdown ? file.name : `${file.name.slice(0, -4)}.md`;
      const content = await file.text();
      const ok = await saveVaultFile(savedName, content);

      setUploads((prev) => [
        { name: file.name, savedName, status: ok ? "saved" : "error" },
        ...prev.filter((u) => u.savedName !== savedName),
      ]);

      if (ok) {
        await refreshVaultList();
      }
    },
    [refreshVaultList],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const { files } = e.dataTransfer;
      for (const file of Array.from(files)) {
        void processFile(file);
      }
    },
    [processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (!files) return;
      for (const file of Array.from(files)) {
        void processFile(file);
      }
      e.target.value = "";
    },
    [processFile],
  );

  return (
    <div className="ob-files-pane">
      <div
        className={`ob-drop-zone${isDragging ? " ob-drop-zone--active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload markdown files"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <Upload size={20} className="ob-drop-icon" />
        <span className="ob-drop-label">
          {isDragging ? "Drop to upload" : "Drop .md / .txt files here, or click to browse"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".md,.txt"
          multiple
          style={{ display: "none" }}
          onChange={handleFileInput}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="ob-upload-list">
          {uploads.map((u) => (
            <li key={u.savedName} className={`ob-upload-item ob-upload-item--${u.status}`}>
              <FileText size={12} />
              <span className="ob-upload-name">{u.savedName}</span>
              <span className="ob-upload-status">{u.status === "saved" ? "✓" : "✗"}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="ob-vault-list-section">
        <span className="ob-vault-list-title">In vault</span>
        {isLoadingVault ? (
          <span className="ob-vault-list-empty">
            <Loader size={12} className="ob-spin" /> Loading…
          </span>
        ) : vaultFiles.length === 0 ? (
          <span className="ob-vault-list-empty">No files uploaded yet</span>
        ) : (
          <ul className="ob-vault-list">
            {vaultFiles.map((f) => (
              <li key={f} className="ob-vault-list-item">
                <FileText size={12} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ─── Main panel ──────────────────────────────────────────────────────────────

type OctobossKnowledgePanelProps = {
  defaultExpanded?: boolean;
};

export const OctobossKnowledgePanel = ({
  defaultExpanded = true,
}: OctobossKnowledgePanelProps) => {
  const [activeTab, setActiveTab] = useState<KnowledgeTab>("briefing");
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="ob-panel">
      <button
        type="button"
        className="ob-panel-header"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
      >
        <span className="ob-panel-title">Knowledge</span>
        <span className="ob-panel-subtitle">Feed data to Octoboss</span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="ob-panel-body">
          <div className="ob-tabs" role="tablist">
            {(["briefing", "prompt", "todo", "files"] as KnowledgeTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`ob-tab${activeTab === tab ? " ob-tab--active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="ob-tab-content">
            {activeTab === "briefing" && (
              <FileEditor
                fileName="BRIEFING.md"
                label="Project Briefing"
                placeholder="Describe the project context, goals, or task. Octoboss reads this to understand what to work on."
                hint="Saved to BRIEFING.md — Octoboss reads this for project context."
              />
            )}
            {activeTab === "prompt" && (
              <FileEditor
                fileName="PROMPT.md"
                label="Task Prompt"
                placeholder="Give Octoboss a specific instruction or task to execute…"
                hint="Saved to PROMPT.md — use this for a direct task instruction."
              />
            )}
            {activeTab === "todo" && (
              <FileEditor
                fileName="todo.md"
                label="Task Checklist"
                placeholder="List tasks grouped by department here..."
                hint="Saved to todo.md — Octoboss reads this to spawn department swarms."
              />
            )}
            {activeTab === "files" && <FilesUploadPane />}
          </div>
        </div>
      )}
    </div>
  );
};
