"use client";

import { useCallback, useRef, useState } from "react";
import Script from "next/script";

const SCOPES = "https://www.googleapis.com/auth/drive.readonly";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";

interface GooglePickerApi {
  PickerBuilder: new () => {
    setOAuthToken: (token: string) => unknown;
    setAppId: (id: string) => unknown;
    setDeveloperKey: (key: string) => unknown;
    addView: (view: unknown) => unknown;
    setCallback: (cb: (data: unknown) => void) => unknown;
    build: () => { setVisible: (visible: boolean) => void };
  };
  View: new (viewId: string) => { setMimeTypes: (mimes: string) => unknown };
  ViewId: { DOCS: string };
  Action: { PICKED: string };
  Response: { DOCUMENTS: string };
  Document: { ID: string; MIME_TYPE: string };
}

declare global {
  interface Window {
    gapi?: {
      load: (name: string, callback: () => void) => void;
      client: { load: (url: string) => Promise<unknown> };
    };
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: unknown }) => void;
          }) => { requestAccessToken: (options?: { prompt?: string }) => void };
        };
      };
      picker?: GooglePickerApi;
    };
  }
}

export default function GoogleDocsPicker({
  onFileSelected,
  onError,
  disabled,
  children,
}: {
  onFileSelected: (file: File) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const tokenClientRef = useRef<{ requestAccessToken: (opts?: { prompt?: string }) => void } | null>(null);
  const accessTokenRef = useRef<string | null>(null);

  const clientId = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "") : "";
  const apiKey = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "") : "";
  const appId = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_GOOGLE_APP_ID ?? "") : "";

  const openPicker = useCallback(() => {
    if (!clientId) {
      onError?.("Google Drive is not configured.");
      return;
    }
    if (!window.google?.accounts?.oauth2?.initTokenClient) {
      onError?.("Google sign-in is loading. Try again in a moment.");
      return;
    }
    if (!window.gapi?.load || !window.google?.picker) {
      onError?.("Google Picker is loading. Try again in a moment.");
      return;
    }

    const picker = window.google?.picker as GooglePickerApi | undefined;
    if (!picker) return;
    const doCreatePicker = (token: string) => {
      const view = new picker.View(picker.ViewId.DOCS);
      view.setMimeTypes(GOOGLE_DOC_MIME);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder = new (picker as any).PickerBuilder()
        .setOAuthToken(token)
        .addView(view)
        .setCallback((data: unknown) => {
          const d = data as { action?: string; [key: string]: unknown };
          if (d.action !== picker.Action.PICKED) return;
          const docs = d[picker.Response.DOCUMENTS] as Array<{ [key: string]: string }> | undefined;
          const doc = docs?.[0];
          if (!doc) return;
          const fileId = doc[picker.Document.ID];
          const mimeType = doc[picker.Document.MIME_TYPE] ?? GOOGLE_DOC_MIME;
          const name = (doc.name as string)?.replace(/\.[^.]+$/, "") || "document";
          const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(DOCX_MIME)}`;
          fetch(exportUrl, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => {
              if (!res.ok) throw new Error("Export failed");
              return res.blob();
            })
            .then((blob) => {
              const file = new File([blob], `${name}.docx`, { type: DOCX_MIME });
              onFileSelected(file);
            })
            .catch(() => onError?.("Failed to export document as DOCX."));
        });
      if (appId) builder.setAppId(appId);
      if (apiKey) builder.setDeveloperKey(apiKey);
      builder.build().setVisible(true);
    };

    if (accessTokenRef.current) {
      doCreatePicker(accessTokenRef.current);
      return;
    }

    const tc = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response: { access_token?: string; error?: unknown }) => {
        if (response.error) {
          onError?.("Google sign-in was cancelled or failed.");
          return;
        }
        if (response.access_token) {
          accessTokenRef.current = response.access_token;
          doCreatePicker(response.access_token);
        }
      },
    });
    tokenClientRef.current = tc;
    tc.requestAccessToken({ prompt: "consent" });
  }, [clientId, apiKey, appId, onFileSelected, onError]);

  const onGapiLoad = useCallback(() => {
    if (!window.gapi) return;
    window.gapi.load("client:picker", () => {
      window.gapi!.client.load("https://www.googleapis.com/discovery/v1/apis/drive/v3/rest").then(
        () => setReady(true),
        () => setReady(true)
      );
    });
  }, []);

  const onGisLoad = useCallback(() => {
    setReady(true);
  }, []);

  return (
    <>
      <Script src="https://apis.google.com/js/api.js" strategy="lazyOnload" onLoad={onGapiLoad} />
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" onLoad={onGisLoad} />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled || !clientId}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--content)] shadow-sm transition-all duration-200 hover:bg-[var(--secondary-bg)] disabled:opacity-50"
      >
        {children}
      </button>
    </>
  );
}
