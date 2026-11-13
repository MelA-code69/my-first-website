/* =========================================================
   Wishlist Noël 2026 — script des réservations partagées
   ---------------------------------------------------------
   Ce code est à copier dans Google Apps Script, depuis un
   Google Sheet (menu Extensions > Apps Script).
   Le mode d'emploi complet est dans README.md.

   Chaque réservation devient une ligne dans la feuille :
     colonne A = numéro de l'idée (data-id)
     colonne B = date de la réservation
     colonne C = code secret (permet à la personne qui a
                 réservé, et à elle seule, d'annuler)
   Pour libérer une idée à la main : supprime sa ligne.
   ========================================================= */

function doGet(e) {
  var p = e.parameter || {};
  var feuille = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);

  try {
    var lignes = feuille.getDataRange().getValues();
    var reservees = {};
    lignes.forEach(function (l) {
      if (l[0] !== '' && l[0] !== null) reservees[String(l[0])] = true;
    });

    var id = p.id ? String(p.id) : '';

    if (p.action === 'reserver' && id) {
      if (reservees[id]) {
        return repondre({ ok: false, erreur: 'deja-reservee', reservees: Object.keys(reservees) });
      }
      feuille.appendRow([id, new Date(), String(p.jeton || '')]);
      reservees[id] = true;
    }

    if (p.action === 'annuler' && id) {
      for (var i = lignes.length - 1; i >= 0; i--) {
        if (String(lignes[i][0]) === id && String(lignes[i][2]) === String(p.jeton || '')) {
          feuille.deleteRow(i + 1);
          delete reservees[id];
        }
      }
    }

    return repondre({ ok: true, reservees: Object.keys(reservees) });
  } finally {
    verrou.releaseLock();
  }
}

function repondre(objet) {
  return ContentService
    .createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}
