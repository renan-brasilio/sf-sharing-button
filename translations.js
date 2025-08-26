/**
 * @description Translations for the SF Sharing Button Chrome extension
 *
 * This file contains all text strings in multiple languages for the extension.
 * The translations are organized by language code and include button text, tooltips, and error messages.
 */

const translations = {
  en: {
    buttonText: "Sharing",
    buttonTitle: "Open Sharing Detail for this record",
    errorNoRecordId: "Could not detect a Record Id on this page. Open a record detail page and try again."
  },
  es: {
    buttonText: "Compartir",
    buttonTitle: "Abrir detalles de compartir para este registro",
    errorNoRecordId: "No se pudo detectar un ID de registro en esta página. Abra una página de detalles de registro e inténtelo de nuevo."
  },
  fr: {
    buttonText: "Partage",
    buttonTitle: "Ouvrir les détails de partage pour cet enregistrement",
    errorNoRecordId: "Impossible de détecter un ID d'enregistrement sur cette page. Ouvrez une page de détails d'enregistrement et réessayez."
  },
  de: {
    buttonText: "Freigabe",
    buttonTitle: "Freigabe-Details für diesen Datensatz öffnen",
    errorNoRecordId: "Auf dieser Seite konnte keine Datensatz-ID erkannt werden. Öffnen Sie eine Datensatz-Detailseite und versuchen Sie es erneut."
  },
  it: {
    buttonText: "Condivisione",
    buttonTitle: "Apri i dettagli di condivisione per questo record",
    errorNoRecordId: "Impossibile rilevare un ID record in questa pagina. Apri una pagina di dettaglio record e riprova."
  },
  pt: {
    buttonText: "Compartilhamento",
    buttonTitle: "Abrir detalhes de compartilhamento para este registro",
    errorNoRecordId: "Não foi possível detectar um ID de registro nesta página. Abra uma página de detalhes do registro e tente novamente."
  },
  ja: {
    buttonText: "共有",
    buttonTitle: "このレコードの共有詳細を開く",
    errorNoRecordId: "このページでレコードIDを検出できませんでした。レコード詳細ページを開いて再試行してください。"
  },
  ko: {
    buttonText: "공유",
    buttonTitle: "이 레코드의 공유 세부정보 열기",
    errorNoRecordId: "이 페이지에서 레코드 ID를 감지할 수 없습니다. 레코드 세부정보 페이지를 열고 다시 시도하세요."
  },
  zh: {
    buttonText: "共享",
    buttonTitle: "打开此记录的共享详细信息",
    errorNoRecordId: "无法在此页面检测到记录ID。请打开记录详细信息页面并重试。"
  },
  ru: {
    buttonText: "Общий доступ",
    buttonTitle: "Открыть детали общего доступа для этой записи",
    errorNoRecordId: "Не удалось обнаружить ID записи на этой странице. Откройте страницу сведений о записи и попробуйте снова."
  },
  ar: {
    buttonText: "مشاركة",
    buttonTitle: "فتح تفاصيل المشاركة لهذا السجل",
    errorNoRecordId: "تعذر اكتشاف معرف السجل في هذه الصفحة. افتح صفحة تفاصيل السجل وحاول مرة أخرى."
  },
  hi: {
    buttonText: "शेयरिंग",
    buttonTitle: "इस रिकॉर्ड के लिए शेयरिंग विवरण खोलें",
    errorNoRecordId: "इस पेज पर रिकॉर्ड ID का पता नहीं लगाया जा सका। कृपया रिकॉर्ड विवरण पेज खोलें और पुनः प्रयास करें।"
  },
  nl: {
    buttonText: "Delen",
    buttonTitle: "Deelgegevens voor dit record openen",
    errorNoRecordId: "Kon geen record-ID detecteren op deze pagina. Open een recorddetailpagina en probeer het opnieuw."
  },
  sv: {
    buttonText: "Delning",
    buttonTitle: "Öppna delningsdetaljer för denna post",
    errorNoRecordId: "Kunde inte upptäcka ett post-ID på denna sida. Öppna en postdetaljsida och försök igen."
  },
  da: {
    buttonText: "Deling",
    buttonTitle: "Åbn delingsdetaljer for denne post",
    errorNoRecordId: "Kunne ikke registrere et post-ID på denne side. Åbn en postdetaljeside og prøv igen."
  },
  fi: {
    buttonText: "Jako",
    buttonTitle: "Avaa tämän tietueen jakotiedot",
    errorNoRecordId: "Tietueen ID:tä ei voitu tunnistaa tällä sivulla. Avaa tietueen yksityiskohtasivu ja yritä uudelleen."
  },
  pl: {
    buttonText: "Udostępnianie",
    buttonTitle: "Otwórz szczegóły udostępniania dla tego rekordu",
    errorNoRecordId: "Nie można wykryć ID rekordu na tej stronie. Otwórz stronę szczegółów rekordu i spróbuj ponownie."
  },
  tr: {
    buttonText: "Paylaşım",
    buttonTitle: "Bu kayıt için paylaşım ayrıntılarını aç",
    errorNoRecordId: "Bu sayfada kayıt ID'si tespit edilemedi. Bir kayıt ayrıntı sayfası açın ve tekrar deneyin."
  },
  he: {
    buttonText: "שיתוף",
    buttonTitle: "פתח פרטי שיתוף עבור רשומה זו",
    errorNoRecordId: "לא ניתן לזהות מזהה רשומה בדף זה. פתח דף פרטי רשומה ונסה שוב."
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = translations;
} else if (typeof window !== 'undefined') {
  window.sfSharingTranslations = translations;
}
