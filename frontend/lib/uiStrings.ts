/**
 * uiStrings.ts — All user-facing text for the ClearSpeech interface.
 *
 * Every string shown to the user lives here, in English, French, German, and Spanish.
 * To add a new language: add a new key to the Lang type and a new entry in
 * UI_STRINGS following the same structure as the existing languages.
 *
 * Usage: import { t } from "../lib/uiStrings" then call t(lang).someKey
 */
export type Lang = "en" | "fr" | "de" | "es";

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
  errorAdminToken: string;
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
  readAloud: string;
  firstRequestNote: string;
  voiceInputBetaLabel: string;
  voiceInputBetaStopLabel: string;
  voiceInputBetaNote: string;
  voiceInputSafariWarning: string;
  voiceInputSafariOnlyNote: string;
  helpVoiceTitle: string;
  helpVoiceReadAloud: string;
  helpVoiceDictation: string;
  testingNote: string;
  teamAccessTitle: string;
  teamAccessBody: string;
  teamAccessLabel: string;
  teamAccessPlaceholder: string;
  teamAccessSave: string;
  teamAccessClear: string;
  teamAccessActive: string;
  teamAccessValidating: string;
  teamAccessInvalid: string;
  teamAccessEmpty: string;
  teamAccessSaved: string;
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
    errorAdminToken: "Daily limit reached even with a privileged access code. Check ADMIN_TOKEN or TEAM_ACCESS_TOKEN in your environment settings.",
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
    readAloud: "🔊 Read aloud",
    firstRequestNote: "The first request may be slower after inactivity.",
    voiceInputBetaLabel: "🎤 Voice input (Beta)",
    voiceInputBetaStopLabel: "🔴 Stop voice input (Beta)",
    voiceInputBetaNote: "Optional — type or use voice, whichever you prefer. Tap the button, wait about 10 seconds, then speak. Voice input is beta and may not be perfect.",
    voiceInputSafariWarning:
      "Voice dictation works best in Safari or Chrome. Please use typing in this browser.",
    voiceInputSafariOnlyNote: "⚠️ Voice dictation is available in Safari and Chrome.",
    helpVoiceTitle: "Voice & audio features",
    helpVoiceReadAloud: "Any text in the app can be read aloud using the 🔊 Read aloud buttons.",
    helpVoiceDictation:
      "You can dictate your message using the 🎤 Voice input button instead of typing.",
    testingNote:
      "There is a limit of about 15 complete conversations per day during the testing period. For more access, contact drjuliegoulet@gmail.com",
    teamAccessTitle: "Team access",
    teamAccessBody:
      "If you are part of the ClearSpeech team, enter your team access code here to remove the daily testing limit on this device.",
    teamAccessLabel: "Team access code",
    teamAccessPlaceholder: "Enter team access code",
    teamAccessSave: "Save code",
    teamAccessClear: "Clear code",
    teamAccessActive: "Team access is active on this device.",
    teamAccessValidating: "Checking code...",
    teamAccessInvalid: "This access code is not valid.",
    teamAccessEmpty: "Enter an access code first.",
    teamAccessSaved: "Access code verified and saved on this device.",
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
    errorAdminToken: "Limite journalière atteinte malgré un code d’accès privilégié — le code est peut-être incorrect. Vérifie ADMIN_TOKEN ou TEAM_ACCESS_TOKEN dans tes paramètres d'environnement.",
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
    readAloud: "🔊 Lire à voix haute",
    firstRequestNote: "La première requête peut être plus lente après une période d’inactivité.",
    voiceInputBetaLabel: "🎤 Saisie vocale (Bêta)",
    voiceInputBetaStopLabel: "🔴 Arrêter la saisie vocale (Bêta)",
    voiceInputBetaNote:
      "Facultatif — tape ou utilise la voix, selon ta préférence. Appuie sur le bouton, attends environ 10 secondes, puis parle. La saisie vocale est en bêta et peut ne pas être parfaite.",
    voiceInputSafariWarning:
      "La dictée vocale fonctionne mieux dans Safari ou Chrome. Veuillez utiliser le clavier dans ce navigateur.",
    voiceInputSafariOnlyNote: "⚠️ La dictée vocale est disponible dans Safari et Chrome.",
    helpVoiceTitle: "Fonctions vocales et audio",
    helpVoiceReadAloud:
      "Tous les textes de l'application peuvent être lus à voix haute grâce aux boutons 🔊 Lire à voix haute.",
    helpVoiceDictation:
      "Tu peux dicter ton message avec le bouton 🎤 Saisie vocale au lieu de taper.",
    testingNote:
      "Il y a une limite d'environ 15 conversations complètes par jour pendant la période de test. Pour plus d'accès, contacte drjuliegoulet@gmail.com",
    teamAccessTitle: "Accès équipe",
    teamAccessBody:
      "Si tu fais partie de l’équipe ClearSpeech, entre ici ton code d’accès équipe pour supprimer la limite quotidienne de test sur cet appareil.",
    teamAccessLabel: "Code d’accès équipe",
    teamAccessPlaceholder: "Entre le code d’accès équipe",
    teamAccessSave: "Enregistrer le code",
    teamAccessClear: "Effacer le code",
    teamAccessActive: "L’accès équipe est actif sur cet appareil.",
    teamAccessValidating: "Vérification du code...",
    teamAccessInvalid: "Ce code d’accès n’est pas valide.",
    teamAccessEmpty: "Entre d’abord un code d’accès.",
    teamAccessSaved: "Code d’accès vérifié et enregistré sur cet appareil.",
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
    errorAdminToken: "Tageslimit trotz privilegiertem Zugangscode erreicht — der Code ist möglicherweise falsch. Prüfe ADMIN_TOKEN oder TEAM_ACCESS_TOKEN in deinen Umgebungseinstellungen.",
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
    readAloud: "🔊 Vorlesen",
    firstRequestNote: "Die erste Anfrage kann nach Inaktivität langsamer sein.",
    voiceInputBetaLabel: "🎤 Spracheingabe (Beta)",
    voiceInputBetaStopLabel: "🔴 Spracheingabe stoppen (Beta)",
    voiceInputBetaNote:
      "Optional — tippe oder sprich, wie du möchtest. Tippe auf den Knopf, warte etwa 10 Sekunden, dann sprich. Die Spracheingabe ist eine Beta-Funktion und kann unvollständig sein.",
    voiceInputSafariWarning:
      "Die Spracheingabe funktioniert am besten in Safari oder Chrome. Bitte verwenden Sie in diesem Browser die Tastatureingabe.",
    voiceInputSafariOnlyNote: "⚠️ Die Spracheingabe ist in Safari und Chrome verfügbar.",
    helpVoiceTitle: "Sprach- und Audiofunktionen",
    helpVoiceReadAloud:
      "Alle Texte in der App können mit den Schaltflächen 🔊 Vorlesen laut vorgelesen werden.",
    helpVoiceDictation:
      "Du kannst deine Nachricht mit dem Knopf 🎤 Spracheingabe diktieren, anstatt zu tippen.",
    testingNote:
      "Während der Testphase gibt es ein Limit von etwa 15 vollständigen Gesprächen pro Tag. Für mehr Zugang, kontaktiere drjuliegoulet@gmail.com",
    teamAccessTitle: "Teamzugang",
    teamAccessBody:
      "Wenn du zum ClearSpeech-Team gehörst, gib hier deinen Teamzugangscode ein, um das tägliche Testlimit auf diesem Gerät aufzuheben.",
    teamAccessLabel: "Teamzugangscode",
    teamAccessPlaceholder: "Teamzugangscode eingeben",
    teamAccessSave: "Code speichern",
    teamAccessClear: "Code löschen",
    teamAccessActive: "Der Teamzugang ist auf diesem Gerät aktiv.",
    teamAccessValidating: "Code wird geprüft...",
    teamAccessInvalid: "Dieser Zugangscode ist ungültig.",
    teamAccessEmpty: "Gib zuerst einen Zugangscode ein.",
    teamAccessSaved: "Zugangscode geprüft und auf diesem Gerät gespeichert.",
  },
  es: {
    title: "ClearSpeech",
    subtitle: "Asistente de comunicación con IA",
    languageLabel: "Idioma / Language / Langue / Sprache",
    yourMessage: "Tu mensaje",
    placeholder: "Escribe tu mensaje aquí...",
    getClearer: "Obtener una versión más clara",
    proposedVersion: "Versión propuesta",
    suggestedSentence: "Frase propuesta",
    questionLabel: "Pregunta",
    yes: "Sí",
    no: "No",
    startOver: "Empezar de nuevo",
    clarifyTitle: "¿Qué quieres decir exactamente?",
    yourAnswer: "Tu respuesta",
    clarifyPlaceholder: "Explica tu intención en pocas palabras...",
    updateSuggestion: "Actualizar propuesta",
    finalText: "Texto final",
    copy: "📋 Copiar!",
    newMessage: "Nuevo mensaje",
    loadingImprove: "Mejorando tu frase...",
    loadingUpdate: "Actualizando la propuesta...",
    errorApi: "Algo salió mal. Inténtalo de nuevo.",
    errorEmptyMessage: "Primero escribe un mensaje.",
    errorEmptyClarification: "Primero añade una aclaración.",
    errorUnknown: "Error desconocido",
    errorCopy: "La copia falló.",
    errorRequest: "La solicitud falló",
    errorAdminToken:
      "Se alcanzó el límite diario incluso con un código de acceso privilegiado; puede que el código sea incorrecto. Revisa ADMIN_TOKEN o TEAM_ACCESS_TOKEN en la configuración del entorno.",
    helpTitle: "ℹ️ Ayuda — cómo funciona esta aplicación",
    helpWhatTitle: "Qué hace esta aplicación",
    helpWhatBody:
      "ClearSpeech convierte un mensaje corto o poco claro en una frase clara que puedes usar en la vida real. Está pensada para personas a quienes les cuesta escribir o encontrar las palabras adecuadas.",
    helpHowTitle: "Cómo usarla (paso a paso)",
    helpStep1: "Escribe tu mensaje en el cuadro (unas pocas palabras bastan).",
    helpStep2:
      'Pulsa "Obtener una versión más clara". La aplicación propone una frase más clara y hace una pregunta sencilla.',
    helpStep3:
      'Responde "Sí" si coincide con lo que quieres decir, o "No" si no coincide.',
    helpStep4:
      'Si pulsas "No", puedes añadir una breve aclaración. La aplicación actualiza la propuesta.',
    helpStep5:
      "Cuando estés conforme, llegarás al texto final y podrás copiarlo.",
    helpTipsTitle: "Conviene saber",
    helpIncomplete:
      "Las entradas incompletas están bien; no necesitas ortografía ni gramática perfectas.",
    helpCopyNote:
      "La frase final se puede copiar con el botón de copiar para pegarla en otro sitio.",
    helpContact: "Contacto",
    helpModel:
      "Las propuestas se generan con el modelo GPT-4.1 mini de OpenAI.",
    helpShow: "Mostrar instrucciones",
    helpHide: "Ocultar instrucciones",
    readAloud: "🔊 Leer en voz alta",
    firstRequestNote: "La primera solicitud puede tardar más después de un periodo de inactividad.",
    voiceInputBetaLabel: "🎤 Entrada de voz (Beta)",
    voiceInputBetaStopLabel: "🔴 Detener entrada de voz (Beta)",
    voiceInputBetaNote:
      "Opcional: escribe o usa la voz, como prefieras. Pulsa el botón, espera unos 10 segundos y luego habla. La entrada de voz está en beta y puede no ser perfecta.",
    voiceInputSafariWarning:
      "El dictado por voz funciona mejor en Safari o Chrome. Usa el teclado en este navegador.",
    voiceInputSafariOnlyNote: "⚠️ El dictado por voz está disponible en Safari y Chrome.",
    helpVoiceTitle: "Funciones de voz y audio",
    helpVoiceReadAloud:
      "Todos los textos de la aplicación pueden leerse en voz alta con los botones 🔊 Leer en voz alta.",
    helpVoiceDictation:
      "Puedes dictar tu mensaje con el botón 🎤 Entrada de voz en lugar de escribir.",
    testingNote:
      "Durante el periodo de prueba hay un límite de unas 15 conversaciones completas por día. Para más acceso, contacta con drjuliegoulet@gmail.com",
    teamAccessTitle: "Acceso del equipo",
    teamAccessBody:
      "Si formas parte del equipo de ClearSpeech, introduce aquí tu código de acceso del equipo para quitar el límite diario de pruebas en este dispositivo.",
    teamAccessLabel: "Código de acceso del equipo",
    teamAccessPlaceholder: "Introduce el código de acceso del equipo",
    teamAccessSave: "Guardar código",
    teamAccessClear: "Borrar código",
    teamAccessActive: "El acceso del equipo está activo en este dispositivo.",
    teamAccessValidating: "Comprobando el código...",
    teamAccessInvalid: "Este código de acceso no es válido.",
    teamAccessEmpty: "Primero introduce un código de acceso.",
    teamAccessSaved: "Código de acceso verificado y guardado en este dispositivo.",
  },
};

export function isLang(value: string): value is Lang {
  return value === "en" || value === "fr" || value === "de" || value === "es";
}

export function t(lang: string): UiStrings {
  return isLang(lang) ? UI_STRINGS[lang] : UI_STRINGS.en;
}
