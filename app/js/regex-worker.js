/* =============================================================
   regex-worker.js — isolierte, abbrechbare Regex-Auswertung
   ============================================================= */
'use strict';

/* Ältere Fassungen von engine.js erwarten window. Der Alias hält
   den Worker auch bei einem direkten file-basierten Test robust. */
self.window = self;
importScripts('engine.js');

self.addEventListener('message', function (event) {
  var msg = event.data || {};
  if (!Number.isFinite(msg.id) || !Array.isArray(msg.jobs)) return;

  var results = msg.jobs.map(function (job) {
    job = job || {};
    try {
      return self.RT.engine.run(
        typeof job.pattern === 'string' ? job.pattern : '',
        typeof job.flags === 'string' ? job.flags : '',
        typeof job.text === 'string' ? job.text : '',
        typeof job.fn === 'string' ? job.fn : 'findall',
        job.extra && typeof job.extra === 'object' ? job.extra : {}
      );
    } catch (error) {
      return {
        ok: false,
        error: 'Die Regex-Auswertung ist unerwartet fehlgeschlagen.',
        raw: error && error.message ? String(error.message) : String(error)
      };
    }
  });

  self.postMessage({ id: msg.id, results: results });
});
