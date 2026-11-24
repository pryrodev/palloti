"use client";

import { useEffect } from "react";
import Script from "next/script";

type TranslationLocale = "fr" | "it";
const GOOGLE_TRANSLATE_UI = [
  ".goog-te-banner-frame",
  ".goog-te-spinner-pos",
  ".goog-te-gadget",
  ".goog-te-menu-frame",
  ".goog-te-ftab",
  ".goog-te-balloon-frame",
  "[class*='goog-te-spinner']",
  "[class*='VIpgJd-ZVi9od']",
  "[id^='goog-gt-']",
  "iframe[src*='translate.google']",
  "iframe[title*='Translate' i]",
].join(",");

function hideGoogleTranslateUi(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(GOOGLE_TRANSLATE_UI).forEach((element) => {
    element.style.setProperty("display", "none", "important");
    element.style.setProperty("visibility", "hidden", "important");
  });
}

declare global {
  interface Window {
    pallotiApplyGoogleTranslation?: (language: TranslationLocale, attempt?: number) => void;
  }
}

function initializeGoogleTranslate(language: TranslationLocale, attempt = 0) {
  if (typeof window === "undefined") return;
  const TranslateElement = window.google?.translate?.TranslateElement;
  if (typeof TranslateElement !== "function") {
    if (attempt < 40) window.setTimeout(() => initializeGoogleTranslate(language, attempt + 1), 150);
    return;
  }

  if (!document.getElementById("google_translate_element")?.childElementCount) {
    try {
      new TranslateElement(
        { pageLanguage: "en", includedLanguages: "fr,it", autoDisplay: false },
        "google_translate_element",
      );
    } catch {
      if (attempt < 40) window.setTimeout(() => initializeGoogleTranslate(language, attempt + 1), 150);
      return;
    }
  }

  window.pallotiApplyGoogleTranslation = (target, attempt = 0) => {
    const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
    const hasLanguage = select && Array.from(select.options).some((option) => option.value === target);
    if (select && hasLanguage) {
      select.value = target;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    if (attempt < 40) window.setTimeout(() => window.pallotiApplyGoogleTranslation?.(target, attempt + 1), 150);
  };

  window.pallotiApplyGoogleTranslation(language);

}

export default function LocaleGoogleTranslate({ language }: { language: TranslationLocale }) {
  useEffect(() => {
    hideGoogleTranslateUi();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches(GOOGLE_TRANSLATE_UI)) hideGoogleTranslateUi(node.parentNode ?? document);
          else hideGoogleTranslateUi(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return <>
    <div id="google_translate_element" className="google-translate-hidden" aria-hidden="true" />
    <Script
      src="https://translate.google.com/translate_a/element.js"
      strategy="afterInteractive"
      onReady={() => initializeGoogleTranslate(language)}
    />
  </>;
}
