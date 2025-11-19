import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import pt from "../public/locales/pt/translation.json";

i18n
  .use(initReactI18next)
  .init({
    lng: "pt",
    fallbackLng: "pt",
    resources: {
      pt: { translation: pt },
    },
  });

export default i18n;
