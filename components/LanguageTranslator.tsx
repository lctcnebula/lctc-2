"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";

type TranslateWindow = Window & {
  lctcTranslateReady?: () => void;
  google?: {
    translate?: {
      TranslateElement?: new (options: { pageLanguage: string; autoDisplay: boolean }, elementId: string) => unknown;
    };
  };
};

export default function LanguageTranslator() {
  const pathname = usePathname();
  const host = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const translateWindow = window as TranslateWindow;
    let active = true;
    const timeout = window.setTimeout(() => {
      if (active && !element.querySelector("select")) setStatus("error");
    }, 15000);

    const labelSelector = () => {
      const select = element.querySelector("select");
      if (!select || !active) return;
      select.id = "site-translation-language";
      select.setAttribute("aria-label", "Select a language to translate this site");
      window.clearTimeout(timeout);
      setStatus("ready");
    };
    const observer = new MutationObserver(labelSelector);
    observer.observe(element, { childList: true, subtree: true });

    const initialize = () => {
      const TranslateElement = translateWindow.google?.translate?.TranslateElement;
      if (!active || !TranslateElement || element.hasChildNodes()) return;
      try {
        new TranslateElement({ pageLanguage: "en", autoDisplay: false }, "google_translate_element");
        labelSelector();
      } catch {
        setStatus("error");
      }
    };
    translateWindow.lctcTranslateReady = initialize;
    initialize();
    setMounted(true);

    return () => {
      active = false;
      observer.disconnect();
      window.clearTimeout(timeout);
      if (translateWindow.lctcTranslateReady === initialize) delete translateWindow.lctcTranslateReady;
    };
  }, []);

  useEffect(() => { setPageUrl(window.location.href); }, [pathname]);

  const fallback = `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(pageUrl)}`;

  return (
    <div className="translation-bar notranslate" translate="no">
      <div className="wrap translation-inner">
        <div className="translation-label"><Icon name="languages" /><span>Translate this site</span></div>
        <div className="translation-control">
          {/* Google owns this empty subtree; React never renders children into it. */}
          <div ref={host} id="google_translate_element" />
          {status === "loading" && <span className="translation-status" role="status">Loading languages…</span>}
          {status === "error" && <a className="translation-fallback" href={fallback} target="_blank" rel="noopener noreferrer">Open in Google Translate <Icon name="arrow-up-right" /><span className="sr-only"> (opens in a new tab)</span></a>}
        </div>
      </div>
      {mounted && <Script
        id="lctc-google-translate"
        src="https://translate.google.com/translate_a/element.js?cb=lctcTranslateReady"
        strategy="afterInteractive"
        onReady={() => (window as TranslateWindow).lctcTranslateReady?.()}
        onError={() => setStatus("error")}
      />}
    </div>
  );
}
