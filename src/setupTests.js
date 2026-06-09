import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import pt from "../public/locales/pt/translation.json";
import '@testing-library/jest-dom';

class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }

  observe(element) {
    this.callback([{ isIntersecting: true, target: element }]);
  }

  unobserve() {}

  disconnect() {}
}

global.IntersectionObserver = IntersectionObserverMock;

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
