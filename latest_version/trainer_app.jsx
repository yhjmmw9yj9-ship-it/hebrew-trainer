const { useState, useMemo, useEffect } = React;

// ============================================================
//  БАЗА ГЛАГОЛОВ
// ============================================================

const VERBS = window.TRAINER_VERBS || [];

// ============================================================
//  ВСПОМОГАТЕЛЬНОЕ
// ============================================================

const PERSON_LABELS = {
  "1s": "אני", "2ms": "אתה", "2fs": "את",
  "3ms": "הוא", "3fs": "היא",
  "1p": "אנחנו", "2mp": "אתם", "2fp": "אתן",
  "3p": "הם / הן", "3mp": "הם",
};
const PERSON_RU = {
  "1s": "я", "2ms": "ты (м)", "2fs": "ты (ж)",
  "3ms": "он", "3fs": "она",
  "1p": "мы", "2mp": "вы (м)", "2fp": "вы (ж)",
  "3p": "они", "3mp": "они (м)",
};
const PRESENT_RU = { ms: "м.р. ед.", fs: "ж.р. ед.", mp: "м.р. мн.", fp: "ж.р. мн." };
const PRESENT_HE = { ms: "הוא", fs: "היא", mp: "הם", fp: "הן" };
const TENSE_RU = { past: "Прошедшее", present: "Настоящее", future: "Будущее", imperative: "Повелительное" };

function stripNikud(s) { return s.normalize("NFC").replace(/[\u0591-\u05C7]/g, ""); }

// ============================================================
//  МОДЕЛИ И ПОЯСНЕНИЯ
// ============================================================

const CONJUGATION_PATTERNS = {
  "פעל": {
    past: { "3ms": "קָטַל", "3fs": "קָטְלָה", "1s": "קָטַלְתִּי", "2ms": "קָטַלְתָּ", "2fs": "קָטַלְתְּ", "1p": "קָטַלְנוּ", "2mp": "קְטַלְתֶּם", "2fp": "קְטַלְתֶּן", "3p": "קָטְלוּ" },
    present: { ms: "קוֹטֵל", fs: "קוֹטֶלֶת", mp: "קוֹטְלִים", fp: "קוֹטְלוֹת" },
    future: { "1s": "אֶקְטוֹל", "2ms": "תִּקְטוֹל", "2fs": "תִּקְטְלִי", "3ms": "יִקְטוֹל", "3fs": "תִּקְטוֹל", "1p": "נִקְטוֹל", "2mp": "תִּקְטְלוּ", "3mp": "יִקְטְלוּ" },
    imperative: { ms: "קְטוֹל", fs: "קִטְלִי", mp: "קִטְלוּ" },
  },
  "פיעל": {
    past: { "3ms": "קִטֵּל", "3fs": "קִטְּלָה", "1s": "קִטַּלְתִּי", "2ms": "קִטַּלְתָּ", "2fs": "קִטַּלְתְּ", "1p": "קִטַּלְנוּ", "2mp": "קִטַּלְתֶּם", "2fp": "קִטַּלְתֶּן", "3p": "קִטְּלוּ" },
    present: { ms: "מְקַטֵּל", fs: "מְקַטֶּלֶת", mp: "מְקַטְּלִים", fp: "מְקַטְּלוֹת" },
    future: { "1s": "אֲקַטֵּל", "2ms": "תְּקַטֵּל", "2fs": "תְּקַטְּלִי", "3ms": "יְקַטֵּל", "3fs": "תְּקַטֵּל", "1p": "נְקַטֵּל", "2mp": "תְּקַטְּלוּ", "3mp": "יְקַטְּלוּ" },
    imperative: { ms: "קַטֵּל", fs: "קַטְּלִי", mp: "קַטְּלוּ" },
  },
  "הפעיל": {
    past: { "3ms": "הִקְטִיל", "3fs": "הִקְטִילָה", "1s": "הִקְטַלְתִּי", "2ms": "הִקְטַלְתָּ", "2fs": "הִקְטַלְתְּ", "1p": "הִקְטַלְנוּ", "2mp": "הִקְטַלְתֶּם", "2fp": "הִקְטַלְתֶּן", "3p": "הִקְטִילוּ" },
    present: { ms: "מַקְטִיל", fs: "מַקְטִילָה", mp: "מַקְטִילִים", fp: "מַקְטִילוֹת" },
    future: { "1s": "אַקְטִיל", "2ms": "תַּקְטִיל", "2fs": "תַּקְטִילִי", "3ms": "יַקְטִיל", "3fs": "תַּקְטִיל", "1p": "נַקְטִיל", "2mp": "תַּקְטִילוּ", "3mp": "יַקְטִילוּ" },
    imperative: { ms: "הַקְטֵל", fs: "הַקְטִילִי", mp: "הַקְטִילוּ" },
  },
  "התפעל": {
    past: { "3ms": "הִתְקַטֵּל", "3fs": "הִתְקַטְּלָה", "1s": "הִתְקַטַּלְתִּי", "2ms": "הִתְקַטַּלְתָּ", "2fs": "הִתְקַטַּלְתְּ", "1p": "הִתְקַטַּלְנוּ", "2mp": "הִתְקַטַּלְתֶּם", "2fp": "הִתְקַטַּלְתֶּן", "3p": "הִתְקַטְּלוּ" },
    present: { ms: "מִתְקַטֵּל", fs: "מִתְקַטֶּלֶת", mp: "מִתְקַטְּלִים", fp: "מִתְקַטְּלוֹת" },
    future: { "1s": "אֶתְקַטֵּל", "2ms": "תִּתְקַטֵּל", "2fs": "תִּתְקַטְּלִי", "3ms": "יִתְקַטֵּל", "3fs": "תִּתְקַטֵּל", "1p": "נִתְקַטֵּל", "2mp": "תִּתְקַטְּלוּ", "3mp": "יִתְקַטְּלוּ" },
    imperative: { ms: "הִתְקַטֵּל", fs: "הִתְקַטְּלִי", mp: "הִתְקַטְּלוּ" },
  },
  "נפעל": {
    past: { "3ms": "נִקְטַל", "3fs": "נִקְטְלָה", "1s": "נִקְטַלְתִּי", "2ms": "נִקְטַלְתָּ", "2fs": "נִקְטַלְתְּ", "1p": "נִקְטַלְנוּ", "2mp": "נִקְטַלְתֶּם", "2fp": "נִקְטַלְתֶּן", "3p": "נִקְטְלוּ" },
    present: { ms: "נִקְטָל", fs: "נִקְטֶלֶת", mp: "נִקְטָלִים", fp: "נִקְטָלוֹת" },
    future: { "1s": "אֶקָּטֵל", "2ms": "תִּקָּטֵל", "2fs": "תִּקָּטְלִי", "3ms": "יִקָּטֵל", "3fs": "תִּקָּטֵל", "1p": "נִקָּטֵל", "2mp": "תִּקָּטְלוּ", "3mp": "יִקָּטְלוּ" },
    imperative: { ms: "הִקָּטֵל", fs: "הִקָּטְלִי", mp: "הִקָּטְלוּ" },
  },
};

const PERSON_ENDING_NOTE_PAST = {
  "1s": "окончание -תִּי для 1 л. ед. ч.",
  "2ms": "окончание -תָּ для 2 л. ед. ч. м.р.",
  "2fs": "окончание -תְּ для 2 л. ед. ч. ж.р.",
  "3ms": "без окончания для 3 л. ед. ч. м.р.",
  "3fs": "окончание -ָה для 3 л. ед. ч. ж.р.",
  "1p": "окончание -נוּ для 1 л. мн. ч.",
  "2mp": "окончание -תֶּם для 2 л. мн. ч. м.р.",
  "2fp": "окончание -תֶּן для 2 л. мн. ч. ж.р.",
  "3p": "окончание -וּ для 3 л. мн. ч.",
};
const PERSON_ENDING_NOTE_FUTURE = {
  "1s": "префикс אֶ- (1 л. ед.)",
  "2ms": "префикс תִּ- (2 л. ед. м.р.)",
  "2fs": "префикс תִּ- + окончание -י (2 л. ед. ж.р.)",
  "3ms": "префикс יִ- (3 л. ед. м.р.)",
  "3fs": "префикс תִּ- (3 л. ед. ж.р., совпадает с 2 м.)",
  "1p": "префикс נִ- (1 л. мн.)",
  "2mp": "префикс תִּ- + окончание -וּ (2 л. мн.)",
  "3mp": "префикс יִ- + окончание -וּ (3 л. мн.)",
};
const PRESENT_NOTE = {
  ms: "форма м.р. ед. — без окончания",
  fs: "форма ж.р. ед. — окончание -ֶת или -ָה",
  mp: "форма м.р. мн. — окончание -ִים",
  fp: "форма ж.р. мн. — окончание -וֹת",
};

// ============================================================
//  ГОРТАННЫЕ И ДАГЕШ-РЕЗИСТЕНТНЫЕ
//  אהח״ע — гортанные: не принимают дагеш, требуют хатафов вместо
//  простого шва, нередко меняют огласовку соседних слогов.
//  ר — не принимает дагеш, ведёт себя как полугортанная.
// ============================================================

const GUTTURALS = ["א", "ה", "ח", "ע"];
const NO_DAGESH = ["א", "ה", "ח", "ע", "ר"];

function rootLetters(rootStr) {
  const finalMap = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
  return rootStr.split("-").map(s => s.trim()).map(c => finalMap[c] || c).filter(Boolean);
}
function isGuttural(letter) { return GUTTURALS.includes(letter); }
function noDagesh(letter) { return NO_DAGESH.includes(letter); }

// Замечания про гортанные. taskKind: "conj" | "noun" | "activeAdj" | "passiveAdj" | "other"
function gutturalNotes(verb, taskKind) {
  const letters = rootLetters(verb.root);
  if (letters.length < 3) return [];
  const pe = letters[0], ayin = letters[1], lamed = letters[letters.length - 1];
  const notes = [];

  // Первая корневая (פ׳)
  if (isGuttural(pe)) {
    if (verb.binyan === "פעל") {
      notes.push(`Первая корневая ${pe} — гортанная: вместо шва под ней появляется хатаф (חֲ-, אֱ-, עֲ-), а в инфинитиве и будущем огласовка префикса смещается к сеголю или хатафу.`);
    } else if (verb.binyan === "הפעיל") {
      notes.push(`Первая корневая ${pe} — гортанная: огласовка префикса הִ- сдвигается к сеголю с хатафом (напр. הֶעֱמִיד вместо ожидаемого הִעְמִיד).`);
    } else if (verb.binyan === "נפעל") {
      notes.push(`Первая корневая ${pe} — гортанная: вместо נִ- появляется נֶ- с компенсаторным удлинением, потому что гортанная не принимает дагеш.`);
    } else {
      notes.push(`Первая корневая ${pe} — гортанная: возможны хатафы и смещение огласовок.`);
    }
  }

  // Средняя корневая (ע׳)
  if (verb.binyan === "פיעל" || verb.binyan === "התפעל" || verb.binyan === "פועל") {
    if (noDagesh(ayin)) {
      notes.push(`Средняя корневая ${ayin} не принимает дагеш: вместо удвоения работает компенсаторное удлинение — патах под первой корневой превращается в камац (т.н. תשלום דגש).`);
    }
  } else if (isGuttural(ayin) && verb.binyan === "פעל") {
    notes.push(`Средняя корневая ${ayin} — гортанная: шва под ней превращается в хатаф (например, חֲ, עֲ).`);
  }

  // Третья корневая (ל׳)
  if (lamed === "ע" || lamed === "ח") {
    if (taskKind === "conj") {
      notes.push(`Третья корневая ${lamed} — гортанная: перед ней нужен «вспомогательный патах» (פתח גנובה), как в יוֹדֵעַ, שׁוֹמֵעַ. В формах ж.р. ед. появляется -ַעַת: יוֹדַעַת.`);
    } else {
      notes.push(`Третья корневая ${lamed} — гортанная: в финальной позиции часто нужен «вспомогательный патах» (יָדוּעַ, שָׁמוּעַ).`);
    }
  } else if (lamed === "א") {
    notes.push(`Третья корневая א — немая в конце слога: огласовка перед ней удлиняется (камац вместо патаха).`);
  }
  // ל״ה уже отмечается через verb.weak — не дублируем

  return notes;
}

function joinGutturalNotes(notes, style) {
  if (!notes || notes.length === 0) return "";
  if (style === "short") return " " + notes[0]; // в кратком — только самое важное
  return " " + notes.join(" ");
}

function getTaskModel(task) {
  if (task.mode === "translation" || task.mode === "government") return null;

  if (task.type === "conjugation") {
    const { verb, tense, person } = task;
    const patterns = CONJUGATION_PATTERNS[verb.binyan];
    if (!patterns || !patterns[tense] || !patterns[tense][person]) return null;
    const pattern = patterns[tense][person];
    const substitution = task.answer;
    let endingNote = "";
    if (tense === "past") endingNote = PERSON_ENDING_NOTE_PAST[person] || "";
    else if (tense === "future") endingNote = PERSON_ENDING_NOTE_FUTURE[person] || "";
    else if (tense === "present") endingNote = PRESENT_NOTE[person] || "";
    else if (tense === "imperative") endingNote = "повелит. накл. в биньяне " + verb.binyan;
    const weakNote = verb.weak ? `Корень слабый (${verb.weak}) — возможны отклонения от шаблона.` : null;
    const gNotes = gutturalNotes(verb, "conj");
    return {
      pattern, substitution,
      explanation: {
        full: `Биньян ${verb.binyan}, ${TENSE_RU[tense].toLowerCase()}, ${endingNote}. Корневые буквы ${verb.root} вставляются в позиции פ-ע-ל шаблона.${weakNote ? " " + weakNote : ""}${joinGutturalNotes(gNotes, "full")}`,
        short: `Шаблон ${verb.binyan} · ${endingNote}.${weakNote ? " " + weakNote : ""}${joinGutturalNotes(gNotes, "short")}`,
      },
    };
  }

  const { verb, kind } = task;
  const d = verb.derivatives ? verb.derivatives[kind] : null;
  if (kind === "noun" && task.answer) {
    const map = {
      "פעל": { pattern: "קְטִילָה", note: "имя действия פעל имеет шаблон קְטִילָה" },
      "פיעל": { pattern: "קִטּוּל", note: "имя действия פיעל имеет шаблон קִטּוּל" },
      "הפעיל": { pattern: "הַקְטָלָה", note: "имя действия הפעיל имеет шаблон הַקְטָלָה" },
      "התפעל": { pattern: "הִתְקַטְּלוּת", note: "имя действия התפעל имеет шаблон הִתְקַטְּלוּת" },
      "נפעל": { pattern: "הִקָּטְלוּת / קְטִילָה", note: "у נפעל имя действия чаще совпадает с פעל — קְטִילָה" },
    };
    const m = map[verb.binyan] || { pattern: "—", note: "" };
    const gNotes = gutturalNotes(verb, "noun");
    return {
      pattern: m.pattern, substitution: task.answer,
      explanation: {
        full: `${m.note}. Корневые буквы ${verb.root} подставляются в позиции פ-ע-ל шаблона ${m.pattern}.${joinGutturalNotes(gNotes, "full")}`,
        short: `Шаблон ${m.pattern} (от биньяна ${verb.binyan}).${joinGutturalNotes(gNotes, "short")}`,
      },
    };
  }
  if (!d) return null;

  if (kind === "noun") {
    const map = {
      "פעל": { pattern: "קְטִילָה", note: "имя действия פעל имеет шаблон קְטִילָה" },
      "פיעל": { pattern: "קִטּוּל", note: "имя действия פיעל имеет шаблон קִטּוּל" },
      "הפעיל": { pattern: "הַקְטָלָה", note: "имя действия הפעיל имеет шаблон הַקְטָלָה" },
      "התפעל": { pattern: "הִתְקַטְּלוּת", note: "имя действия התפעל имеет шаблон הִתְקַטְּלוּת" },
      "נפעל": { pattern: "הִקָּטְלוּת / קְטִילָה", note: "у נפעל имя действия чаще совпадает с פעל — קְטִילָה" },
    };
    const m = map[verb.binyan] || { pattern: "—", note: "" };
    const gNotes = gutturalNotes(verb, "noun");
    return {
      pattern: m.pattern, substitution: d.form,
      explanation: {
        full: `${m.note}. Корневые буквы ${verb.root} подставляются в позиции פ-ע-ל шаблона ${m.pattern}.${joinGutturalNotes(gNotes, "full")}`,
        short: `Шаблон ${m.pattern} (от биньяна ${verb.binyan}).${joinGutturalNotes(gNotes, "short")}`,
      },
    };
  }

  if (kind === "activeAdj") {
    const map = { "פעל": "קוֹטֵל", "פיעל": "מְקַטֵּל", "הפעיל": "מַקְטִיל", "התפעל": "מִתְקַטֵּל", "נפעל": "נִקְטָל" };
    const p = map[verb.binyan] || "—";
    const gNotes = gutturalNotes(verb, "activeAdj");
    return {
      pattern: p, substitution: d.form,
      explanation: {
        full: `Действительное причастие в иврите совпадает с формой настоящего времени м.р. ед. ч.: шаблон ${p} в биньяне ${verb.binyan}.${joinGutturalNotes(gNotes, "full")}`,
        short: `Шаблон ${p} = настоящее м.р. ед.${joinGutturalNotes(gNotes, "short")}`,
      },
    };
  }

  if (kind === "passiveAdj") {
    const map = {
      "פעל": { p: "קָטוּל", note: "страд. прич. פעל — шаблон קָטוּל" },
      "פיעל": { p: "מְקֻטָּל", note: "страд. прич. פיעל — шаблон מְקֻטָּל (биньян פּוּעַל)" },
      "הפעיל": { p: "מוּקְטָל", note: "страд. прич. הפעיל — шаблон מוּקְטָל (биньян הוּפְעַל)" },
      "התפעל": { p: "קָטוּל", note: "от התפעל страд. прич. обычно нет; берётся форма פָעוּל от того же корня" },
      "נפעל": { p: "נִקְטָל", note: "у נפעל страдательное значение совпадает с самой основой" },
    };
    const m = map[verb.binyan] || { p: "—", note: "" };
    const gNotes = gutturalNotes(verb, "passiveAdj");
    return {
      pattern: m.p, substitution: d.form,
      explanation: {
        full: `${m.note}. Корень ${verb.root} вставляется в позиции פ-ע-ל шаблона.${joinGutturalNotes(gNotes, "full")}`,
        short: `Шаблон ${m.p}.${joinGutturalNotes(gNotes, "short")}`,
      },
    };
  }

  if (kind === "placeNoun") {
    const gNotes = gutturalNotes(verb, "other");
    return {
      pattern: d.pattern || "מִקְטָל / מַקְטָל", substitution: d.form,
      explanation: {
        full: `Имя места или инструмента образуется по шаблону ${d.pattern || "מִקְטָל / מַקְטָל"} с приставкой מ- от корня ${verb.root}. Эти формы лексикализованы — конкретное значение нужно знать.${joinGutturalNotes(gNotes, "full")}`,
        short: `Шаблон ${d.pattern || "מִקְטָל / מַקְטָל"} (приставка מ-).${joinGutturalNotes(gNotes, "short")}`,
      },
    };
  }

  if (kind === "abstractNoun") {
    return {
      pattern: d.pattern || "תַּקְטִיל", substitution: d.form,
      explanation: {
        full: `Связанное отглагольное имя по шаблону ${d.pattern || "תַּקְטִיל"} от корня ${verb.root}. Эти формы непродуктивны: их образует не каждый корень, нужно запоминать.`,
        short: `Шаблон ${d.pattern || "תַּקְטִיל"} — лексикализован.`,
      },
    };
  }
  return null;
}

const DIFFICULTY_PROFILES = {
  1: { label: "Лёгкий", desc: "Только настоящее и прошедшее. Все подсказки и развёрнутые пояснения.", tenses: ["present", "past"], derivKinds: ["noun", "activeAdj"], autoHints: { translit: true, root: true, binyan: true, model: true, nikudInTask: true }, explainStyle: "full" },
  2: { label: "Базовый", desc: "+ Будущее. Транслит скрыт, модель видна.", tenses: ["present", "past", "future"], derivKinds: ["noun", "activeAdj"], autoHints: { translit: false, root: true, binyan: true, model: true, nikudInTask: true }, explainStyle: "full" },
  3: { label: "Средний", desc: "+ Повелительное. Биньян и модель скрыты, но пояснение после ответа развёрнутое.", tenses: ["present", "past", "future", "imperative"], derivKinds: ["noun", "activeAdj", "passiveAdj"], autoHints: { translit: false, root: true, binyan: false, model: false, nikudInTask: true }, explainStyle: "full" },
  4: { label: "Сложный", desc: "+ Страдательные и מקטל-имена. Корень скрыт, никуд в задании убран. Пояснение краткое.", tenses: ["present", "past", "future", "imperative"], derivKinds: ["noun", "activeAdj", "passiveAdj", "placeNoun"], autoHints: { translit: false, root: false, binyan: false, model: false, nikudInTask: false }, explainStyle: "short" },
  5: { label: "Эксперт", desc: "+ תקטיל-имена. Только перевод, минимум пояснений.", tenses: ["present", "past", "future", "imperative"], derivKinds: ["noun", "activeAdj", "passiveAdj", "placeNoun", "abstractNoun"], autoHints: { translit: false, root: false, binyan: false, model: false, nikudInTask: false }, explainStyle: "short" },
};

const DERIV_LABELS = {
  noun: "Имя действия (שם פעולה)",
  activeAdj: "Действительное причастие / прилагательное",
  passiveAdj: "Страдательное причастие (פעול / מופעל / מקוטל)",
  placeNoun: "Имя места или инструмента (מקטל)",
  abstractNoun: "תקטיל / связанное имя",
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
const randomItem = pick;

function normalizeHebrewAnswer(s) {
  return stripNikud(String(s || "")).trim().replace(/\s+/g, "");
}

// "Тема" задания — то, на чём мы можем сфокусироваться при ошибке.
// Спряжение: биньян + время. Словообразование: биньян + тип производной.
function taskTopic(task) {
  if (!task) return null;
  if (task.mode === "translation") {
    return { mode: "translation", binyan: task.verb.binyan, key: "translation" };
  }
  if (task.mode === "government") {
    return { mode: "government", binyan: task.verb.binyan, key: task.expected };
  }
  if (task.mode === "actionNoun") {
    return { mode: "actionNoun", binyan: task.verb.binyan, key: "noun" };
  }
  if (task.type === "conjugation") {
    return { mode: "conjugation", binyan: task.verb.binyan, key: task.tense };
  }
  return { mode: "derivation", binyan: task.verb.binyan, key: task.kind };
}

function topicMatches(topic, taskCandidate) {
  const t = taskTopic(taskCandidate);
  if (!t || !topic) return false;
  return t.mode === topic.mode && t.binyan === topic.binyan && t.key === topic.key;
}

function hasForms(section) {
  return section && Object.keys(section).length > 0;
}

function hasActionNoun(verb) {
  return verb.actionNoun !== null && verb.actionNoun !== undefined && verb.actionNoun !== "";
}

function getWeaknessSignature(verb) {
  const root = verb.root || "";
  const letters = root.split("-");

  if (verb.inf === "להיות") return "haya-special";

  if (letters.includes("ו") || letters.includes("י")) return "weak-vav-yod";
  if (letters[0] === "נ") return "initial-nun";
  if (letters[0] === "י") return "initial-yod";
  if (letters[2] === "ה") return "final-he";
  if (["א", "ה", "ח", "ע"].some(x => letters.includes(x))) return "guttural";
  if (letters.length === 4) return "four-letter-root";

  return "regular";
}

function hasTaskShape(verb, shape) {
  if (shape.mode === "translation") {
    return !!(verb.meaning && verb.inf);
  }

  if (shape.mode === "government") {
    const options = parseGovernment(verb.government);
    if (!options.length) return false;
    return shape.expectedGovernment ? options.includes(shape.expectedGovernment) : true;
  }

  if (shape.mode === "actionNoun") {
    return hasActionNoun(verb);
  }

  if (!shape.tense) return false;

  const section = verb[shape.tense];
  if (!section || Object.keys(section).length === 0) return false;

  if (shape.pronoun) {
    return !!section[shape.pronoun];
  }

  return true;
}

function buildTaskForShape(verb, shape) {
  if (shape.mode === "translation") {
    return buildTranslationTask(verb);
  }

  if (shape.mode === "government") {
    return buildGovernmentTask(verb, shape.expectedGovernment);
  }

  if (shape.mode === "actionNoun") {
    if (!hasActionNoun(verb)) return null;
    return {
      type: "derivation",
      verb,
      kind: "noun",
      label: DERIV_LABELS.noun,
      answer: verb.actionNoun,
      meaning: null,
      mode: "actionNoun",
      tense: "שם פעולה",
      person: null,
      pronoun: null,
      expected: verb.actionNoun,
      prompt: `תן/י שם פעולה של ${verb.inf}`,
    };
  }

  const section = verb[shape.tense];
  const expected = section?.[shape.pronoun];

  if (!expected) return null;

  return {
    type: "conjugation",
    verb,
    tense: shape.tense,
    person: shape.pronoun,
    pronoun: shape.pronoun,
    answer: expected,
    expected,
    mode: "conjugation",
    prompt: `Please give me a correct form of ${verb.inf} for ${shape.pronoun} in ${shape.tense}`,
  };
}

function buildConjugationTask(verb, difficulty, topicConstraint) {
  const profile = DIFFICULTY_PROFILES[difficulty];

  let tenses = profile.tenses.filter(t => hasForms(verb[t]));
  if (topicConstraint && topicConstraint.mode === "conjugation"
      && topicConstraint.binyan === verb.binyan
      && tenses.includes(topicConstraint.key)) {
    tenses = [topicConstraint.key];
  }
  if (tenses.length === 0) return null;
  const tense = pick(tenses);
  const personKeys = Object.keys(verb[tense]);
  const person = pick(personKeys);
  const answer = verb[tense][person];
  return { type: "conjugation", mode: "conjugation", verb, tense, person, pronoun: person, answer, expected: answer };
}

function buildActionNounTask(verb) {
  if (!hasActionNoun(verb)) return null;
  return {
    type: "derivation",
    mode: "actionNoun",
    verb,
    kind: "noun",
    label: DERIV_LABELS.noun,
    answer: verb.actionNoun,
    expected: verb.actionNoun,
    meaning: null,
    hint: `Корень: ${verb.root || "?"} · Биньян: ${verb.binyan || "?"}`,
  };
}

function buildTranslationTask(verb) {
  if (!verb.meaning || !verb.inf) return null;

  return {
    type: "translation",
    verb,
    mode: "translation",
    tense: "перевод",
    pronoun: null,
    person: null,
    answer: verb.inf,
    expected: verb.inf,
    acceptedAnswers: [verb.inf],
    prompt: `Переведи на иврит: ${verb.meaning}`,
    hint: `Корень: ${verb.root || "?"} · Биньян: ${verb.binyan || "?"}`,
  };
}

function parseGovernment(gov) {
  if (!gov) return [];
  return gov
    .split("+")
    .map(x => x.trim())
    .filter(x => x && x !== "ø");
}

function normalizeGovAnswer(s) {
  return String(s || "")
    .trim()
    .replace(/[־-]$/g, "")
    .replace(/\s+/g, "")
    .replace(/^ל$/, "ל")
    .replace(/^ב$/, "ב")
    .replace(/^מ$/, "מ")
    .replace(/^עם$/, "עם")
    .replace(/^על$/, "על")
    .replace(/^אל$/, "אל")
    .replace(/^אצל$/, "אצל")
    .replace(/^את$/, "את");
}

function buildGovernmentTask(verb, forcedExpected) {
  const options = parseGovernment(verb.government);
  if (!options.length) return null;

  const expected = forcedExpected && options.includes(forcedExpected) ? forcedExpected : randomItem(options);
  const cloze = buildGovernmentCloze(verb, expected);

  return {
    type: "government",
    verb,
    mode: "government",
    tense: "управление",
    pronoun: null,
    person: null,
    answer: expected,
    expected,
    acceptedAnswers: [expected],
    prompt: cloze || `Какой предлог/маркер управления используется с ${verb.inf}?`,
    hint: verb.example ? `Пример: ${verb.example}` : "",
    governmentOptions: options,
  };
}

function buildGovernmentCloze(verb, expected) {
  if (!verb.example) return null;
  const expectedForText = expected.replace(/[־-]$/g, "");

  const parts = String(verb.example)
    .split("/")
    .map(x => x.trim())
    .filter(Boolean);

  for (const part of parts) {
    const escaped = expectedForText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let re = new RegExp(`(^|\\s)${escaped}\\s+`);
    if (re.test(part)) {
      return `השלם: ${part.replace(re, "$1___ ")}`;
    }

    if (["ב", "ל", "מ", "כ"].includes(expectedForText)) {
      const protectedPart = part.startsWith(verb.inf) ? `__INF__${part.slice(verb.inf.length)}` : part;
      const prefixedRe = new RegExp(`(^|\\s)${expectedForText}([\\u05D0-\\u05EA])`);
      if (prefixedRe.test(protectedPart)) {
        return `השלם: ${protectedPart.replace(prefixedRe, "$1___ $2").replace("__INF__", verb.inf)}`;
      }
    }

    if (expectedForText === "את") {
      const etRe = /(^|\s)את\s+/;
      if (etRe.test(part)) {
        return `השלם: ${part.replace(etRe, "$1___ ")}`;
      }
    }
  }

  return null;
}

function buildTaskByMode(verb, selectedMode, difficulty, topicConstraint) {
  if (selectedMode === "translation") {
    return buildTranslationTask(verb);
  }

  if (selectedMode === "government") {
    return buildGovernmentTask(verb);
  }

  if (selectedMode === "conjugation") {
    return buildConjugationTask(verb, difficulty, topicConstraint);
  }

  if (selectedMode === "actionNoun") {
    return buildActionNounTask(verb);
  }

  if (selectedMode === "mixed") {
    const possible = [];

    const c = buildConjugationTask(verb, difficulty, topicConstraint);
    if (c) possible.push(c);

    const tr = buildTranslationTask(verb);
    if (tr) possible.push(tr);

    const gov = buildGovernmentTask(verb);
    if (gov) possible.push(gov);

    const an = buildActionNounTask(verb);
    if (an) possible.push(an);

    if (!possible.length) return null;

    return randomItem(possible);
  }

  return null;
}

function buildTask(verb, mode, difficulty, topicConstraint) {
  return buildTaskByMode(verb, mode, difficulty, topicConstraint);
}

function verbSupportsMode(verb, selectedMode) {
  if (selectedMode === "translation") return !!(verb.meaning && verb.inf);
  if (selectedMode === "government") return parseGovernment(verb.government).length > 0;
  if (selectedMode === "conjugation") return ["past", "present", "future", "imperative"].some(t => hasForms(verb[t]));
  if (selectedMode === "actionNoun") return hasActionNoun(verb);
  if (selectedMode === "mixed") {
    return verbSupportsMode(verb, "translation") ||
      verbSupportsMode(verb, "government") ||
      verbSupportsMode(verb, "conjugation") ||
      verbSupportsMode(verb, "actionNoun");
  }
  return false;
}

// ============================================================
//  МЕЛКИЕ КОМПОНЕНТЫ UI
// ============================================================

function HebrewText({ children, showNikud, big, size }) {
  const text = showNikud ? children : stripNikud(children);
  return (
    <span dir="rtl" lang="he"
      style={{
        fontFamily: '"Frank Ruhl Libre", "David Libre", "SBL Hebrew", "Times New Roman", serif',
        fontSize: size || (big ? "2.6rem" : "1.3rem"),
        lineHeight: 1.4, letterSpacing: "0.01em",
      }}>{text}</span>
  );
}

function Tag({ children, tone }) {
  const tones = {
    level: { bg: "#f4ead8", fg: "#7a4a1f", border: "#d9c39a" },
    binyan: { bg: "#efe4d8", fg: "#5a3a2a", border: "#c8a888" },
    root: { bg: "#eaeae0", fg: "#3a3a2a", border: "#b8b89a" },
  };
  const t = tones[tone] || tones.level;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px",
      background: t.bg, color: t.fg, border: `1px solid ${t.border}`,
      borderRadius: 999, fontSize: "0.78rem", fontWeight: 600,
      letterSpacing: "0.04em", textTransform: "uppercase",
      marginRight: 6, marginBottom: 4,
    }}>{children}</span>
  );
}

function Selector({ label, value, onChange, options }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a6a48" }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: "8px 10px", background: "#fff", border: "1px solid #c8a888", borderRadius: 6, fontFamily: "Georgia, serif", fontSize: "0.95rem", color: "#2b2218" }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: "#7a2a18" }} />
      <span>{label}</span>
    </label>
  );
}

function Btn({ children, onClick, disabled, primary, ghost }) {
  const base = {
    padding: "10px 18px", fontSize: "0.95rem", fontFamily: "Georgia, serif",
    border: "1px solid", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, transition: "transform 0.05s ease, background 0.15s ease",
    fontWeight: 600, letterSpacing: "0.02em",
  };
  let style;
  if (primary) style = { ...base, background: "#7a2a18", color: "#fdf6e3", borderColor: "#5a1a0e" };
  else if (ghost) style = { ...base, background: "transparent", color: "#5a3a2a", borderColor: "#c8a888" };
  else style = { ...base, background: "#f0e0c0", color: "#2b2218", borderColor: "#c8a888" };
  return (
    <button onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}

function DifficultySlider({ value, onChange }) {
  const profile = DIFFICULTY_PROFILES[value];
  return (
    <div style={{
      background: "#fffaf0", border: "1px solid #d8c8a8", borderRadius: 10,
      padding: "16px 20px", marginBottom: 16,
      boxShadow: "0 4px 14px -10px rgba(90,50,20,0.2)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a6a48" }}>Сложность</span>
        <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, fontSize: "1.1rem", color: "#7a2a18" }}>
          {value} · {profile.label}
        </span>
      </div>
      <input type="range" min={1} max={5} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#7a2a18" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginTop: 4 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <span key={n} style={{ fontWeight: n === value ? 700 : 400, color: n === value ? "#7a2a18" : "#a88a60" }}>{n}</span>
        ))}
      </div>
      <p style={{ marginTop: 10, marginBottom: 0, color: "#5a4a38", fontStyle: "italic", fontSize: "0.92rem" }}>
        {profile.desc}
      </p>
    </div>
  );
}

function ModelBlock({ model, compact }) {
  if (!model) return null;
  return (
    <div style={{
      marginTop: 12, padding: "12px 16px",
      background: "#f6efde", border: "1px solid #d9c39a",
      borderLeft: "3px solid #7a2a18", borderRadius: 6, direction: "rtl",
    }}>
      <div style={{ direction: "ltr", fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a6a48", marginBottom: 6 }}>Модель</div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <HebrewText showNikud size={compact ? "1.4rem" : "1.6rem"}>{model.pattern}</HebrewText>
      </div>
    </div>
  );
}

// ============================================================
//  ОСНОВНОЙ КОМПОНЕНТ
// ============================================================

const MODE_TABS = [
  ["mixed", "Смешанный"],
  ["conjugation", "Спряжение"],
  ["translation", "Перевод"],
  ["government", "Управление"],
];

function HebrewTrainer() {
  const [level, setLevel] = useState("B1-B2");
  const [mode, setMode] = useState("mixed");
  const [showHint, setShowHint] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [nikudInAnswer, setNikudInAnswer] = useState(true);
  const [extraHints, setExtraHints] = useState({ root: false, binyan: false, translit: false, model: false });

  const [task, setTask] = useState(null);
  const [message, setMessage] = useState("");
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [feedback, setFeedback] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);

  // Адаптивность: "фокус" — тема, на которой произошла ошибка.
  // streakOnFocus — сколько правильных ответов подряд после включения фокуса.
  // Когда streak >= 2 — фокус снимается.
  const [focus, setFocus] = useState(null);
  const [streakOnFocus, setStreakOnFocus] = useState(0);

  const profile = DIFFICULTY_PROFILES[difficulty];
  const filteredPool = useMemo(() => VERBS.filter(v => v.level === level), [level]);
  const pool = filteredPool.length ? filteredPool : VERBS;

  function getSimilarVerbs(failedVerb, shape) {
    const selectedLevelCount = VERBS.filter(x => x.level === level).length;
    const sameLevelPool = VERBS.filter(v => {
      const levelOk = !level || v.level === level || selectedLevelCount === 0;
      return levelOk && v.inf !== failedVerb.inf;
    });

    if (shape.mode === "government") {
      const sameGovernment = sameLevelPool.filter(v => hasTaskShape(v, shape));
      if (sameGovernment.length) return sameGovernment;
      return sameLevelPool.filter(v => parseGovernment(v.government).length > 0);
    }

    if (shape.mode === "translation") {
      const exactTranslation = sameLevelPool.filter(v =>
        v.binyan === shape.binyan &&
        getWeaknessSignature(v) === shape.weaknessSignature &&
        hasTaskShape(v, shape)
      );
      if (exactTranslation.length >= 2) return exactTranslation;

      const sameBinyanTranslation = sameLevelPool.filter(v =>
        v.binyan === shape.binyan &&
        hasTaskShape(v, shape)
      );
      if (sameBinyanTranslation.length >= 2) return sameBinyanTranslation;

      return sameLevelPool.filter(v => hasTaskShape(v, shape));
    }

    const exact = sameLevelPool.filter(v =>
      v.binyan === shape.binyan &&
      getWeaknessSignature(v) === shape.weaknessSignature &&
      hasTaskShape(v, shape)
    );

    if (exact.length >= 2) return exact;

    const sameBinyan = sameLevelPool.filter(v =>
      v.binyan === shape.binyan &&
      hasTaskShape(v, shape)
    );

    if (sameBinyan.length >= 2) return sameBinyan;

    return sameLevelPool.filter(v => hasTaskShape(v, shape));
  }

  function nextTask(focusOverride) {
    if (!pool.length) {
      setTask(null);
      setMessage("Нет глаголов для выбранного уровня.");
      return;
    }

    const forcedShape = reviewQueue.length > 0 ? reviewQueue[0] : null;
    if (forcedShape) {
      setReviewQueue(q => q.slice(1));
      const failedVerb = VERBS.find(v => v.inf === forcedShape.failedVerbInf) || task?.verb || {};
      const candidates = getSimilarVerbs(failedVerb, forcedShape);
      for (let i = 0; i < 20 && candidates.length > 0; i++) {
        const verb = candidates[Math.floor(Math.random() * candidates.length)];
        const t = buildTaskForShape(verb, forcedShape);
        if (t) {
          setTask(t); setInput(""); setRevealed(false);
          setExtraHints({ root: false, binyan: false, translit: false, model: false });
          setShowHint(false);
          setShowMeaning(false);
          setMessage("");
          setFeedback(null);
          return;
        }
      }
    }

    const activeFocus = focusOverride !== undefined ? focusOverride : focus;
    let m = mode;

    // Сначала пытаемся попасть в тему фокуса (если он есть)
    if (activeFocus) {
      // Глаголы с подходящим биньяном — приоритетные
      const matchingVerbs = pool.filter(v => v.binyan === activeFocus.binyan);
      const verbsToTry = matchingVerbs.length > 0 ? matchingVerbs : pool;
      for (let i = 0; i < 40; i++) {
        const verb = verbsToTry[Math.floor(Math.random() * verbsToTry.length)];
        const targetMode = activeFocus.mode;
        const t = buildTask(verb, targetMode, difficulty, activeFocus);
        if (t && topicMatches(activeFocus, t)) {
          setTask(t); setInput(""); setRevealed(false);
          setExtraHints({ root: false, binyan: false, translit: false, model: false });
          setShowHint(false);
          setShowMeaning(false);
          setMessage("");
          setFeedback(null);
          return;
        }
      }
      // Если не получилось — снимаем фокус и идём обычным путём
      setFocus(null);
      setStreakOnFocus(0);
    }

    // Обычный случайный выбор
    const taskPool = pool.filter(v => verbSupportsMode(v, mode));
    if (!taskPool.length) {
      setTask(null);
      setMessage("Нет заданий для выбранного режима.");
      return;
    }

    for (let i = 0; i < 40; i++) {
      const verb = taskPool[Math.floor(Math.random() * taskPool.length)];
      m = mode;
      const t = buildTask(verb, m, difficulty);
      if (t) {
        setTask(t); setInput(""); setRevealed(false);
        setExtraHints({ root: false, binyan: false, translit: false, model: false });
        setShowHint(false);
          setShowMeaning(false);
        setMessage("");
        setFeedback(null);
        return;
      }
    }
    setTask(null);
    setMessage("Не удалось создать задание для выбранных настроек.");
  }

  useEffect(() => {
    // При смене уровня/режима/сложности сбрасываем фокус
    setFocus(null); setStreakOnFocus(0);
    setReviewQueue([]);
    nextTask(null);
    // eslint-disable-next-line
  }, [level, mode, difficulty]);

  function check() {
    if (!task) return;
    const rawAnswer = input.trim();
    let ok = false;

    if (task.mode === "translation") {
      const accepted = task.acceptedAnswers || [task.expected];
      ok = accepted.some(ans => normalizeHebrewAnswer(rawAnswer) === normalizeHebrewAnswer(ans));
    } else if (task.mode === "government") {
      const accepted = task.acceptedAnswers || [task.expected];
      ok = accepted.some(ans => normalizeGovAnswer(rawAnswer) === normalizeGovAnswer(ans));
    } else if (task.acceptedAnswers) {
      const a = stripNikud(rawAnswer);
      ok = task.acceptedAnswers.some(ans => a === stripNikud(String(ans || "").trim())) && a.length > 0;
    } else {
      const a = stripNikud(rawAnswer);
      const b = stripNikud(task.answer.trim());
      ok = a === b && a.length > 0;
    }

    setFeedback(ok ? "right" : "wrong");
    setRevealed(true);
    setScore(s => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));

    // Обновляем адаптивное повторение
    if (!ok) {
      let shape;
      if (task.mode === "translation") {
        shape = {
          mode: "translation",
          binyan: task.verb.binyan,
          weaknessSignature: getWeaknessSignature(task.verb),
          failedVerbInf: task.verb.inf,
        };
      } else if (task.mode === "government") {
        shape = {
          mode: "government",
          expectedGovernment: task.expected,
          binyan: task.verb.binyan,
          failedVerbInf: task.verb.inf,
        };
      } else {
        shape = {
          tense: task.type === "conjugation" ? task.tense : null,
          pronoun: task.type === "conjugation" ? (task.pronoun || task.person || null) : null,
          mode: task.type === "derivation" && task.kind === "noun" ? "actionNoun" : (task.mode || "conjugation"),
          binyan: task.verb.binyan,
          weaknessSignature: getWeaknessSignature(task.verb),
          failedVerbInf: task.verb.inf,
        };
      }
      setReviewQueue([shape, shape]);
      setMessage("Ошибка. Следующие 2 задания будут на похожий тип.");
      // Ошибка → две похожие задачи в reviewQueue, затем обычная генерация.
      setFocus(null);
      setStreakOnFocus(0);
    } else if (focus) {
      // Правильный ответ при активном фокусе
      const onTopic = topicMatches(focus, task);
      if (onTopic) {
        const newStreak = streakOnFocus + 1;
        if (newStreak >= 2) {
          setFocus(null); setStreakOnFocus(0);
        } else {
          setStreakOnFocus(newStreak);
        }
      }
    }
  }
  function reveal() {
    setRevealed(true); setFeedback(null);
    // Если пользователь сдался и попросил показать — относимся как к ошибке для адаптивности
    setFocus(taskTopic(task));
    setStreakOnFocus(0);
  }

  const showRoot = profile.autoHints.root || extraHints.root;
  const showBinyan = profile.autoHints.binyan || extraHints.binyan;
  const showTranslit = profile.autoHints.translit || extraHints.translit;
  const showModel = profile.autoHints.model || extraHints.model;
  const nikudInTask = profile.autoHints.nikudInTask;

  const taskModel = task ? getTaskModel(task) : null;

  function changeMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setInput("");
    setShowHint(false);
          setShowMeaning(false);
    setReviewQueue([]);
  }

  function renderTaskBody() {
    if (!task) return null;
    const { verb } = task;

    const verbHeader = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        {task.mode !== "translation" || revealed ? (
          <HebrewText showNikud={nikudInTask} big>{verb.inf}</HebrewText>
        ) : (
          <div style={{ fontSize: "1.3rem", color: "#8a6a48", fontStyle: "italic" }}>?</div>
        )}
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#6a5a48", fontSize: "1rem", textAlign: "right" }}>
          {showTranslit && <span>{verb.translit} — </span>}
          {showMeaning
            ? <span style={{ cursor: "pointer" }} onClick={() => setShowMeaning(false)}>{verb.meaning}</span>
            : <button onClick={() => setShowMeaning(true)} style={{
                background: "transparent", border: "1px dashed #c8a888", borderRadius: 999,
                color: "#8a6a48", fontFamily: "Georgia, serif", fontStyle: "italic",
                fontSize: "0.82rem", cursor: "pointer", padding: "1px 10px",
              }}>перевод</button>
          }
        </div>
        <div>
          {(showRoot || task.mode === "translation" || task.mode === "government") && <Tag tone="root">корень {verb.root}</Tag>}
          {(showBinyan || task.mode === "translation" || task.mode === "government") && <Tag tone="binyan">биньян {verb.binyan}</Tag>}
          <Tag tone="level">{verb.level}</Tag>
        </div>
      </div>
    );

    let promptLine;
    if (task.prompt) {
      promptLine = (<>{task.prompt}</>);
    } else if (task.type === "conjugation") {
      if (task.tense === "imperative") {
        const map = { ms: "м.р. ед.", fs: "ж.р. ед.", mp: "мн.ч." };
        promptLine = (<>Образуйте <strong style={{ color: "#7a2a18" }}>повелительное наклонение</strong>, форма: <strong style={{ color: "#7a2a18" }}>{map[task.person] || task.person}</strong></>);
      } else if (task.tense === "present") {
        promptLine = (<>Поставьте в форму: <strong style={{ color: "#7a2a18" }}>настоящее</strong>, <strong style={{ color: "#7a2a18" }}>{PRESENT_RU[task.person] || task.person}</strong> (<span dir="rtl" lang="he" style={{ fontFamily: '"Frank Ruhl Libre", serif' }}>{PRESENT_HE[task.person] || task.person}</span>)</>);
      } else {
        promptLine = (<>Поставьте в форму: <strong style={{ color: "#7a2a18" }}>{TENSE_RU[task.tense]}</strong>, <strong style={{ color: "#7a2a18" }}>{PERSON_RU[task.person] || task.person}</strong> (<span dir="rtl" lang="he" style={{ fontFamily: '"Frank Ruhl Libre", serif' }}>{PERSON_LABELS[task.person] || task.person}</span>)</>);
      }
    } else {
      promptLine = (<>Образуйте: <strong style={{ color: "#7a2a18" }}>{task.label}</strong></>);
    }

    return (
      <>
        {verbHeader}
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px dashed #c9b89a" }}>
          <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a6a48" }}>
            Задание · {task.mode === "translation" ? "перевод" : task.mode === "government" ? "управление" : task.type === "conjugation" ? "спряжение" : "словообразование"}
          </div>
          <div style={{ marginTop: 8, fontSize: "1.12rem", color: "#2b2218" }}>{promptLine}</div>
          {showModel && <ModelBlock model={taskModel} compact={profile.explainStyle === "short"} />}
          {task.hint && !showHint && (
            <button onClick={() => setShowHint(true)}
              style={{
                marginTop: 12, padding: "6px 12px", background: "transparent",
                border: "1px dashed #c8a888", borderRadius: 999,
                color: "#7a2a18", fontFamily: "Georgia, serif",
                fontSize: "0.85rem", cursor: "pointer",
              }}>
              Показать подсказку
            </button>
          )}
          {task.hint && showHint && (
            <div style={{ marginTop: 10, color: "#6a5a48", fontSize: "0.95rem" }}>{task.hint}</div>
          )}
        </div>
      </>
    );
  }

  function renderAnswerBlock() {
    if (!task || !revealed) return null;
    const right = feedback === "right";
    const wrong = feedback === "wrong";
    const meaning = task.type === "derivation" ? task.meaning : null;
    const explanation = taskModel && taskModel.explanation ? taskModel.explanation[profile.explainStyle] : null;

    return (
      <div style={{
        marginTop: 18, padding: "16px 20px",
        background: right ? "#e8f0e0" : wrong ? "#f5e0d8" : "#f0e8d8",
        border: `1px solid ${right ? "#9ab080" : wrong ? "#c89080" : "#c8b890"}`,
        borderRadius: 8,
      }}>
        <div style={{ fontSize: "0.78rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#6a5a48" }}>
          {right ? "Верно" : wrong ? "Не совсем" : "Правильный ответ"}
        </div>
        <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", justifyContent: "flex-end", direction: "rtl" }}>
          <HebrewText showNikud={nikudInAnswer} big>{task.answer}</HebrewText>
          {meaning && <span style={{ color: "#5a4a38", fontStyle: "italic", direction: "ltr" }}>— {meaning}</span>}
        </div>
        {wrong && input.trim() && (
          <div style={{ marginTop: 8, color: "#7a2a18", fontSize: "0.95rem" }}>
            Ваш ответ: <span dir="rtl" lang="he" style={{ fontFamily: '"Frank Ruhl Libre", serif', fontSize: "1.2rem" }}>{input}</span>
          </div>
        )}

        {explanation && (
          <div style={{
            marginTop: 12, paddingTop: 12,
            borderTop: `1px dashed ${right ? "#9ab080" : wrong ? "#c89080" : "#c8b890"}`,
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {!showModel && taskModel && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, justifyContent: "flex-end", direction: "rtl", flexWrap: "wrap" }}>
                <span style={{ direction: "ltr", fontSize: "0.72rem", letterSpacing: "0.12em", color: "#6a5a48", textTransform: "uppercase" }}>модель:</span>
                <HebrewText showNikud size="1.25rem">{taskModel.pattern}</HebrewText>
                <span style={{ color: "#a88a60", direction: "ltr" }}>→</span>
                <HebrewText showNikud size="1.25rem">{taskModel.substitution}</HebrewText>
              </div>
            )}
            <div style={{ color: "#3a2e22", fontSize: profile.explainStyle === "short" ? "0.9rem" : "0.95rem", lineHeight: 1.5 }}>
              {explanation}
            </div>
          </div>
        )}
      </div>
    );
  }

  const hintButtons = [];
  if (!showModel) hintButtons.push({ key: "model", label: "Модель" });
  if (!showRoot) hintButtons.push({ key: "root", label: "Корень" });
  if (!showBinyan) hintButtons.push({ key: "binyan", label: "Биньян" });
  if (!showTranslit) hintButtons.push({ key: "translit", label: "Транслит" });

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top right, #f8efdc 0%, #f3e6c8 40%, #ecd9a8 100%)",
      padding: "32px 16px 64px", fontFamily: 'Georgia, "Times New Roman", serif', color: "#2b2218",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <header style={{ marginBottom: 24, textAlign: "center" }}>
          <div style={{
            display: "inline-block", padding: "4px 14px", border: "1px solid #7a2a18",
            borderRadius: 999, color: "#7a2a18", fontSize: "0.72rem",
            letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12,
          }}>עברית · тренажёр</div>
          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: "2.4rem", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
            Глаголы и словообразование
          </h1>
          <p style={{ marginTop: 6, color: "#6a5a48", fontStyle: "italic" }}>
            Спряжение по временам и лицам · отглагольные существительные и причастия
          </p>
        </header>

        <DifficultySlider value={difficulty} onChange={setDifficulty} />

        <section style={{
          background: "rgba(255, 252, 245, 0.7)", border: "1px solid #d8c8a8",
          borderRadius: 10, padding: "16px 20px", marginBottom: 22,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
            <Selector label="Уровень лексики" value={level} onChange={setLevel}
              options={[{ v: "A1", l: "A1 — начальный" }, { v: "A2", l: "A2 — базовый" }, { v: "B1-B2", l: "B1-B2 — средний+" }]} />
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a6a48", marginBottom: 6 }}>Режим</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MODE_TABS.map(([value, label]) => {
                const active = mode === value;
                return (
                  <button key={value}
                    onClick={() => changeMode(value)}
                    style={{
                      padding: "8px 14px",
                      border: `1px solid ${active ? "#7a2a18" : "#c8a888"}`,
                      borderRadius: 999,
                      background: active ? "#7a2a18" : "#fffaf0",
                      color: active ? "#fdf6e3" : "#4a3828",
                      fontFamily: "Georgia, serif",
                      fontSize: "0.92rem",
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                    }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 14, fontSize: "0.92rem" }}>
            <Toggle label="Никуд в ответе" checked={nikudInAnswer} onChange={setNikudInAnswer} />
          </div>
        </section>

        <section style={{
          background: "#fffaf0", border: "1px solid #c8a888", borderRadius: 12,
          padding: "26px 28px", boxShadow: "0 8px 24px -12px rgba(90,50,20,0.25)", position: "relative",
        }}>
          <div style={{ position: "absolute", top: 14, left: 18, fontSize: "0.7rem", letterSpacing: "0.2em", color: "#a88a60", textTransform: "uppercase" }}>
            #{score.total + (revealed ? 0 : 1)}
          </div>
          <div style={{ position: "absolute", top: 14, right: 18, fontSize: "0.85rem", color: "#7a2a18", fontWeight: 600 }}>
            {score.right} / {score.total}
          </div>

          <div style={{ marginTop: 18 }}>
            {message && !task ? (
              <div style={{ color: "#7a2a18", fontSize: "1rem", textAlign: "right" }}>{message}</div>
            ) : renderTaskBody()}
          </div>
          {message && task && (
            <div style={{ marginTop: 12, color: "#7a2a18", fontSize: "0.95rem", textAlign: "right" }}>
              {message}
            </div>
          )}

          <div style={{ marginTop: 22 }}>
            <input dir="rtl" lang="he" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !revealed) check(); }}
              placeholder="הכנס/י תשובה כאן…"
              style={{
                width: "100%", padding: "14px 16px", fontSize: "1.5rem",
                fontFamily: '"Frank Ruhl Libre", "David Libre", "Times New Roman", serif',
                background: "#fff", border: "1px solid #c8a888", borderRadius: 8,
                outline: "none", color: "#2b2218", boxSizing: "border-box",
              }} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <Btn primary onClick={check} disabled={revealed || !input.trim()}>Проверить</Btn>
            <Btn onClick={reveal} disabled={revealed}>Показать ответ</Btn>
            <Btn ghost onClick={() => nextTask()}>Следующий →</Btn>
          </div>

          {!revealed && hintButtons.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", color: "#8a6a48", letterSpacing: "0.1em", textTransform: "uppercase" }}>Подсказки:</span>
              {hintButtons.map(h => (
                <button key={h.key}
                  onClick={() => setExtraHints(prev => ({ ...prev, [h.key]: true }))}
                  style={{
                    padding: "5px 12px", background: "transparent",
                    border: "1px dashed #c8a888", borderRadius: 999,
                    color: "#7a2a18", fontFamily: "Georgia, serif",
                    fontSize: "0.85rem", cursor: "pointer",
                  }}>+ {h.label}</button>
              ))}
            </div>
          )}

          {renderAnswerBlock()}
        </section>

        <footer style={{ textAlign: "center", marginTop: 28, color: "#8a7a60", fontSize: "0.85rem" }}>
          Словарь: {VERBS.length} глаголов · уровень <b>{level}</b>: {filteredPool.length} · пул заданий: {pool.length}
        </footer>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<HebrewTrainer />);
