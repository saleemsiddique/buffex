import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

// Inicialización central (solo configuración, sin hooks)
void i18n
  .use(HttpApi) // carga /public/locales/{{lng}}/translation.json
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ["en", "es"],
    fallbackLng: "es",
    interpolation: { escapeValue: false },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
      requestOptions: process.env.NODE_ENV === "development"
        ? { cache: "no-cache" }
        : undefined,
    }
  });

export default i18n;
