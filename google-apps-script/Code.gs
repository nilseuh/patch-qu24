/**
 * Patch QU-24 — base de données dans un Google Sheet.
 * 1. Colle ce fichier dans Extensions > Apps Script du Google Sheet.
 * 2. Exécute une fois la fonction « installer » (autorise l'accès).
 * 3. Déployer > Nouveau déploiement > Application Web
 *    (Exécuter en tant que : Moi · Qui a accès : Tout le monde).
 * Le mot de passe d'édition se change dans Paramètres du projet >
 * Propriétés du script > EDIT_PASSWORD.
 */
const PASSWORD_DEFAULT = "micm";

const SCHEMA = {
  channels: { sheet: "Entrées", cols: [["id","Piste"],["label","Nom console"],["desc","Qui / quoi"],["cat","Catégorie"],["src","Micro / source"],["plug","Branchement"],["note","Note"],["updatedAt","Modifié (horodatage)"],["updatedBy","Modifié par"]] },
  mixes:    { sheet: "Mix",     cols: [["id","Mix"],["name","Nom console"],["spk","Enceinte(s)"],["type","Type"],["out","Sortie physique"],["note","Note"],["updatedAt","Modifié (horodatage)"],["updatedBy","Modifié par"]] },
  scenes:   { sheet: "Scènes",  cols: [["id","N°"],["name","Nom"],["when","Quand l'utiliser"],["note","Note"],["updatedAt","Modifié (horodatage)"],["updatedBy","Modifié par"]] },
  cats:     { sheet: "Catégories", cols: [["id","Id"],["label","Nom"],["color","Couleur"]] }
};
const DEFAULT_CATS = [
  ["voix","Chant","#d9463f"],["parole","Parole / pasteur","#e38b16"],["inst","Instrument (micro)","#33a04f"],
  ["clav","Clavier / DI","#8457d6"],["batt","Batterie / perc.","#1f95b5"],["lect","Lecture (PC, tél.)","#cc3fa4"],["autre","Autre","#7d8794"]
];
const HEX = /^#[0-9a-fA-F]{6}$/;

function installer() {
  Object.keys(SCHEMA).forEach(sheetOf_);
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty("EDIT_PASSWORD")) props.setProperty("EDIT_PASSWORD", PASSWORD_DEFAULT);
  if (sheetOf_("cats").getLastRow() < 2) writeCats_(DEFAULT_CATS.map(c => ({ id: c[0], label: c[1], color: c[2] })));
  if (sheetOf_("channels").getLastRow() < 2) {
    upsert_("channels", "24", {
      label: "TEST", desc: "Exemple : chant lead, pupitre gauche", cat: "voix",
      src: "Shure SM58 sans fil, récepteur 1", plug: "Boîtier de scène, prise 24",
      note: "Piste modèle à copier : nom en 6 lettres max, qui/quoi, micro utilisé, où c'est branché. Ici : 48V coupé, coupe-bas (HPF) à 100 Hz."
    }, "Exemple");
  }
}

function sheetOf_(key) {
  const def = SCHEMA[key];
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(def.sheet);
  if (!sh) {
    sh = ss.insertSheet(def.sheet);
    sh.getRange(1, 1, 1, def.cols.length).setValues([def.cols.map(c => c[1])]).setFontWeight("bold");
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), def.cols.length).setNumberFormat("@");
  }
  return sh;
}

function readAll_(key) {
  const def = SCHEMA[key], sh = sheetOf_(key), n = sh.getLastRow(), out = {};
  if (n < 2) return out;
  sh.getRange(2, 1, n - 1, def.cols.length).getDisplayValues().forEach(row => {
    if (!row[0]) return;
    const o = {};
    def.cols.forEach((c, i) => { o[c[0]] = row[i]; });
    o.updatedAt = Number(o.updatedAt) || 0;
    out[row[0]] = o;
  });
  return out;
}

function readCats_() {
  const all = readAll_("cats");
  return Object.keys(all).map(k => all[k]).filter(c => c.label);
}

function clean_(v, max) {
  let s = String(v == null ? "" : v).slice(0, max || 500);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // empêche l'interprétation comme formule
  return s;
}

function findRow_(sh, id) {
  const n = sh.getLastRow();
  if (n < 2) return -1;
  const ids = sh.getRange(2, 1, n - 1, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return -1;
}

function upsert_(key, id, data, by) {
  const def = SCHEMA[key], sh = sheetOf_(key);
  data = data || {};
  const row = def.cols.map(c => {
    if (c[0] === "id") return clean_(id, 40);
    if (c[0] === "updatedAt") return String(Date.now());
    if (c[0] === "updatedBy") return clean_(by, 40);
    return clean_(data[c[0]]);
  });
  let r = findRow_(sh, id);
  if (r < 0) r = sh.getLastRow() + 1;
  const range = sh.getRange(r, 1, 1, row.length);
  range.setNumberFormat("@");
  range.setValues([row]);
}

function delete_(key, id) {
  const sh = sheetOf_(key), r = findRow_(sh, id);
  if (r > 0) sh.deleteRow(r);
}

function writeCats_(list) {
  const sh = sheetOf_("cats");
  const rows = (Array.isArray(list) ? list : []).slice(0, 30)
    .filter(c => c && /^[\w-]{1,30}$/.test(String(c.id)) && String(c.label || "").trim())
    .map(c => [clean_(c.id, 30), clean_(String(c.label).trim(), 30), HEX.test(c.color) ? c.color : "#7d8794"]);
  if (!rows.length) return;
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 3).clearContent();
  const range = sh.getRange(2, 1, rows.length, 3);
  range.setNumberFormat("@");
  range.setValues(rows);
}

function snapshot_() {
  return { ok: true, t: Date.now(), channels: readAll_("channels"), mixes: readAll_("mixes"), scenes: readAll_("scenes"), cats: readCats_() };
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function ensure_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty("INSTALLED") === "1") return;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (props.getProperty("INSTALLED") !== "1") { installer(); props.setProperty("INSTALLED", "1"); }
  } finally { lock.releaseLock(); }
}

function doGet() {
  ensure_();
  return json_(snapshot_());
}

function doPost(e) {
  ensure_();
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "requete" }); }
  const pw = PropertiesService.getScriptProperties().getProperty("EDIT_PASSWORD") || PASSWORD_DEFAULT;
  if (String(b.pw || "").trim().toLowerCase() !== pw.trim().toLowerCase()) return json_({ ok: false, error: "password" });
  if (b.action === "check") return json_({ ok: true });
  const cols = ["channels", "mixes", "scenes"];
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (b.action === "set" && cols.indexOf(b.col) >= 0 && b.id) upsert_(b.col, String(b.id), b.data, b.by);
    else if (b.action === "delete" && cols.indexOf(b.col) >= 0 && b.id) delete_(b.col, String(b.id));
    else if (b.action === "setCats") writeCats_(b.list);
    else return json_({ ok: false, error: "action" });
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return json_(snapshot_());
}
