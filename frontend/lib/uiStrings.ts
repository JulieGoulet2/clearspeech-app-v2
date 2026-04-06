export type Lang = "en" | "fr" | "de";

export type UiStrings = {
  title: string;
  subtitle: string;
  languageLabel: string;
  yourMessage: string;
  placeholder: string;
  getClearer: string;
  proposedVersion: string;
  suggestedSentence: string;
  questionLabel: string;
  yes: string;
  no: string;
  startOver: string;
  clarifyTitle: string;
  yourAnswer: string;
  clarifyPlaceholder: string;
  updateSuggestion: string;
  finalText: string;
  copy: string;
  newMessage: string;
  loadingImprove: string;
  loadingUpdate: string;
  errorApi: string;
  errorEmptyMessage: string;
  errorEmptyClarification: string;
  errorUnknown: string;
  errorCopy: string;
  errorRequest: string;
  helpTitle: string;
  helpWhatTitle: string;
  helpWhatBody: string;
  helpHowTitle: string;
  helpStep1: string;
  helpStep2: string;
  helpStep3: string;
  helpStep4: string;
  helpStep5: string;
  helpTipsTitle: string;
  helpIncomplete: string;
  helpCopyNote: string;
  helpContact: string;
  helpModel: string;
  helpShow: string;
  helpHide: string;
};

export const UI_STRINGS: Record<Lang, UiStrings> = {
  en: {
    title: "ClearSpeech",
    subtitle: "AI communication assistant",
    languageLabel: "Language / Langue / Sprache",
    yourMessage: "Your message",
    placeholder: "Write your message here...",
    getClearer: "Get clearer version",
    proposedVersion: "Proposed version",
    suggestedSentence: "Suggested sentence",
    questionLabel: "Question",
    yes: "Yes",
    no: "No",
    startOver: "Start over",
    clarifyTitle: "What do you mean exactly?",
    yourAnswer: "Your answer",
    clarifyPlaceholder: "Explain your meaning in a few words...",
    updateSuggestion: "Update suggestion",
    finalText: "Final text",
    copy: "📋 Copy!",
    newMessage: "New message",
    loadingImprove: "Improving your sentence...",
    loadingUpdate: "Updating suggestion...",
    errorApi: "Something went wrong. Please try again.",
    errorEmptyMessage: "Please write a message first.",
    errorEmptyClarification: "Please add a clarification first.",
    errorUnknown: "Unknown error",
    errorCopy: "Copy failed.",
    errorRequest: "Request failed",
    helpTitle: "ℹ️ Help — how this app works",
    helpWhatTitle: "What this app does",
    helpWhatBody:
      "ClearSpeech turns a short or unclear message into a clear sentence you can use in real life. It is meant for people who find writing or finding the right words difficult.",
    helpHowTitle: "How to use it (step by step)",
    helpStep1: "Write your message in the box (a few words is enough).",
    helpStep2: 'Tap "Get clearer version". The app proposes a clearer sentence and asks a simple question.',
    helpStep3: 'Answer "Yes" if it matches what you mean, or "No" if it does not.',
    helpStep4:
      'If you tap "No", you can add one short clarification. The app updates the suggestion.',
    helpStep5: "When you are happy, you reach the final text and can copy it.",
    helpTipsTitle: "Good to know",
    helpIncomplete:
      "Incomplete input is OK — you do not need perfect spelling or grammar.",
    helpCopyNote:
      "The final sentence can be copied with the copy button so you can paste it elsewhere.",
    helpContact: "Contact",
    helpModel:
      "Suggestions are generated using OpenAI’s GPT-4.1 mini model.",
    helpShow: "Show instructions",
    helpHide: "Hide instructions",
  },
  fr: {
    title: "ClearSpeech",
    subtitle: "Assistant IA de communication",
    languageLabel: "Langue / Language / Sprache",
    yourMessage: "Ton message",
    placeholder: "Écris ton message ici...",
    getClearer: "Obtenir une version plus claire",
    proposedVersion: "Version proposée",
    suggestedSentence: "Phrase proposée",
    questionLabel: "Question",
    yes: "Oui",
    no: "Non",
    startOver: "Recommencer",
    clarifyTitle: "Qu’est-ce que tu veux dire exactement ?",
    yourAnswer: "Ta réponse",
    clarifyPlaceholder: "Explique ton intention en quelques mots...",
    updateSuggestion: "Mettre à jour la proposition",
    finalText: "Texte final",
    copy: "📋 Copier!",
    newMessage: "Nouveau message",
    loadingImprove: "Amélioration de la phrase...",
    loadingUpdate: "Mise à jour de la proposition...",
    errorApi: "Un problème est survenu. Réessaie plus tard.",
    errorEmptyMessage: "Écris d’abord un message.",
    errorEmptyClarification: "Ajoute d’abord une précision.",
    errorUnknown: "Erreur inconnue",
    errorCopy: "La copie a échoué.",
    errorRequest: "La requête a échoué",
    helpTitle: "ℹ️ Aide — comment utiliser l’application",
    helpWhatTitle: "Ce que fait l’application",
    helpWhatBody:
      "ClearSpeech transforme un message court ou peu clair en phrase claire que tu peux utiliser au quotidien. Elle s’adresse aux personnes pour qui écrire ou trouver les mots est difficile.",
    helpHowTitle: "Comment l’utiliser (étapes)",
    helpStep1: "Écris ton message dans la zone (quelques mots suffisent).",
    helpStep2:
      "Appuie sur « Obtenir une version plus claire ». L’application propose une phrase et pose une question simple.",
    helpStep3:
      "Réponds « Oui » si c’est bien ce que tu veux dire, ou « Non » sinon.",
    helpStep4:
      "Si tu choisis « Non », tu peux ajouter une courte précision. L’application met à jour la proposition.",
    helpStep5:
      "Quand c’est bon, tu arrives au texte final et tu peux le copier.",
    helpTipsTitle: "À savoir",
    helpIncomplete:
      "Une entrée incomplète, c’est OK — pas besoin d’orthographe ou de grammaire parfaites.",
    helpCopyNote:
      "Le texte final peut être copié avec le bouton pour le coller ailleurs.",
    helpContact: "Contact",
    helpModel:
      "Les propositions sont générées avec le modèle GPT-4.1 mini d’OpenAI.",
    helpShow: "Voir les instructions",
    helpHide: "Masquer les instructions",
  },
  de: {
    title: "ClearSpeech",
    subtitle: "KI-Kommunikationsassistent",
    languageLabel: "Sprache / Language / Langue",
    yourMessage: "Deine Nachricht",
    placeholder: "Schreibe hier deine Nachricht...",
    getClearer: "Klarere Version erzeugen",
    proposedVersion: "Vorgeschlagene Version",
    suggestedSentence: "Vorgeschlagener Satz",
    questionLabel: "Frage",
    yes: "Ja",
    no: "Nein",
    startOver: "Neu anfangen",
    clarifyTitle: "Was meinst du genau?",
    yourAnswer: "Deine Antwort",
    clarifyPlaceholder: "Erkläre deine Absicht in wenigen Worten...",
    updateSuggestion: "Vorschlag aktualisieren",
    finalText: "Finaler Text",
    copy: "📋 Kopieren!",
    newMessage: "Neue Nachricht",
    loadingImprove: "Dein Satz wird verbessert...",
    loadingUpdate: "Vorschlag wird aktualisiert...",
    errorApi: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    errorEmptyMessage: "Bitte schreib zuerst eine Nachricht.",
    errorEmptyClarification: "Bitte ergänze zuerst eine Klärung.",
    errorUnknown: "Unbekannter Fehler",
    errorCopy: "Kopieren fehlgeschlagen.",
    errorRequest: "Anfrage fehlgeschlagen",
    helpTitle: "ℹ️ Hilfe — so funktioniert die App",
    helpWhatTitle: "Was die App macht",
    helpWhatBody:
      "ClearSpeech macht aus einer kurzen oder unklaren Nachricht einen klaren Satz, den du im Alltag nutzen kann. Sie richtet sich an Menschen, denen Schreiben oder das Finden der richtigen Worte schwerfällt.",
    helpHowTitle: "So geht’s (Schritt für Schritt)",
    helpStep1: "Schreib deine Nachricht in das Feld (ein paar Wörter reichen).",
    helpStep2:
      "Tippe auf « Klarere Version erzeugen ». Die App schlägt einen Satz vor und stellt eine einfache Frage.",
    helpStep3:
      "Antworte mit « Ja », wenn es passt, oder « Nein », wenn nicht.",
    helpStep4:
      "Bei « Nein » kannst du kurz ergänzen. Die App aktualisiert den Vorschlag.",
    helpStep5:
      "Wenn du zufrieden bist, siehst du den finalen Text und kannst ihn kopieren.",
    helpTipsTitle: "Wichtig",
    helpIncomplete:
      "Unvollständige Eingaben sind in Ordnung — perfekte Rechtschreibung ist nicht nötig.",
    helpCopyNote:
      "Der finale Satz kann kopiert und woanders eingefügt werden.",
    helpContact: "Kontakt",
    helpModel:
      "Die Vorschläge werden mit dem Modell GPT-4.1 mini von OpenAI erzeugt.",
    helpShow: "Anleitung anzeigen",
    helpHide: "Anleitung ausblenden",
  },
};

export function isLang(value: string): value is Lang {
  return value === "en" || value === "fr" || value === "de";
}

export function t(lang: string): UiStrings {
  return isLang(lang) ? UI_STRINGS[lang] : UI_STRINGS.en;
}
