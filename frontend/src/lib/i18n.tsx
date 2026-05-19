"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { en } from "@/content/i18n/en";
import { tr } from "@/content/i18n/tr";

export type Locale = "tr" | "en";
type Messages = typeof tr | typeof en;

const I18nContext = createContext<{ locale: Locale; t: Messages; setLocale: (l: Locale) => void }>({
  locale: "tr",
  t: tr,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("tr");
  const t = locale === "en" ? en : tr;

  useEffect(() => {
    const saved = localStorage.getItem("financescout_locale") as Locale | null;
    if (saved === "en" || saved === "tr") setLocale(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("financescout_locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nContext.Provider value={{ locale, t, setLocale }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
