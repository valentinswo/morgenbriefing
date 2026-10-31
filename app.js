// Morgenbriefing – lädt briefings/index.json (Liste der Ausgaben) und zeigt die gewählte Ausgabe an.
(function () {
  "use strict";

  var view = document.getElementById("view");
  var pick = document.getElementById("pick");
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");

  var ids = [];          // Datums-IDs, neueste zuerst
  var cache = {};        // id -> geladene Ausgabe
  var current = null;

  var WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Absatztext: alles escapen, danach nur **fett** erlauben
  function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"); }
  function safeUrl(u) { return /^https:\/\//i.test(String(u || "")) ? String(u) : null; }
  function isId(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")); }

  function shortLabel(id) {
    var p = id.split("-");
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    return WEEKDAYS[d.getUTCDay()] + ", " + p[2] + "." + p[1] + "." + p[0].slice(2);
  }

  function showNote(title, text) {
    view.innerHTML = '<div class="note"><h2>' + esc(title) + "</h2><p>" + esc(text) + "</p></div>";
  }

  function getJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(r.status + " " + url);
      return r.json();
    });
  }

  function renderIssue(d) {
    var h = [];
    h.push('<header class="issue"><p class="kicker">' + esc(d.weekday) + " · " + esc(d.dateLabel) + "</p>");
    h.push("<h1>Morgenbriefing</h1>");
    if (d.lede) h.push('<p class="lede">' + fmt(d.lede) + "</p>");
    h.push("</header>");

    var secs = Array.isArray(d.sections) ? d.sections : [];
    if (secs.length) {
      h.push('<nav class="toc" aria-label="Rubriken">');
      secs.forEach(function (s, i) {
        h.push('<a href="#" data-sec="sec-' + i + '">' + esc(s.short || s.title) + "</a>");
      });
      h.push("</nav>");
    }

    secs.forEach(function (s, i) {
      h.push('<section class="topic" id="sec-' + i + '"><h2><span class="tag">' + (i + 1) + "</span>" + esc(s.title) + "</h2>");
      if (Array.isArray(s.figures) && s.figures.length) {
        h.push('<div class="figs">');
        s.figures.forEach(function (f) {
          var dir = /^[-−]/.test(String(f.change || "")) ? "down" : "up";
          h.push('<div class="fig"><b>' + esc(f.label) + "</b><span>" + esc(f.value) +
            (f.change ? '<span class="chg ' + dir + '">' + esc(f.change) + "</span>" : "") + "</span></div>");
        });
        h.push("</div>");
      }
      (Array.isArray(s.paragraphs) ? s.paragraphs : []).forEach(function (p) { h.push("<p>" + fmt(p) + "</p>"); });
      var srcs = (Array.isArray(s.sources) ? s.sources : []).filter(function (x) { return x && safeUrl(x.url); });
      if (srcs.length) {
        h.push('<p class="src">Quellen: ' + srcs.map(function (x) {
          return '<a href="' + esc(safeUrl(x.url)) + '" target="_blank" rel="noopener">' + esc(x.label || x.url) + "</a>";
        }).join(" · ") + "</p>");
      }
      h.push("</section>");
    });

    h.push('<footer class="meta">' + esc(d.footer || "Keine Anlageberatung.") + "</footer>");
    view.innerHTML = h.join("");

    view.querySelectorAll("nav.toc a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var t = document.getElementById(a.getAttribute("data-sec"));
        if (t) t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      });
    });
  }

  function updateControls() {
    var i = ids.indexOf(current);
    pick.value = current;
    prevBtn.disabled = i < 0 || i >= ids.length - 1;  // ältere Ausgabe
    nextBtn.disabled = i <= 0;                        // neuere Ausgabe
  }

  function select(id, opts) {
    opts = opts || {};
    if (ids.indexOf(id) < 0) id = ids[0];
    current = id;
    updateControls();

    // Neueste Ausgabe ohne Hash, ältere mit #JJJJ-MM-TT (zum Teilen/Bookmarken)
    if (!opts.fromHash) {
      var hash = id === ids[0] ? "" : "#" + id;
      try { history.replaceState(null, "", location.pathname + location.search + hash); } catch (e) {}
    }

    var done = function (d) {
      if (current !== id) return;  // inzwischen andere Ausgabe gewählt
      renderIssue(d);
      if (!opts.keepScroll) window.scrollTo(0, 0);
    };
    if (cache[id]) return done(cache[id]);
    showNote("Ausgabe wird geladen", "Einen Moment …");
    getJSON("briefings/" + id + ".json").then(function (d) {
      cache[id] = d;
      done(d);
    }).catch(function () {
      if (current === id) showNote("Ausgabe nicht gefunden", "Die Ausgabe vom " + shortLabel(id) + " konnte nicht geladen werden.");
    });
  }

  pick.addEventListener("change", function () { select(pick.value); });
  prevBtn.addEventListener("click", function () {
    var i = ids.indexOf(current);
    if (i < ids.length - 1) select(ids[i + 1]);
  });
  nextBtn.addEventListener("click", function () {
    var i = ids.indexOf(current);
    if (i > 0) select(ids[i - 1]);
  });
  window.addEventListener("hashchange", function () {
    var h = location.hash.slice(1);
    if (isId(h) && ids.indexOf(h) >= 0) select(h, { fromHash: true });
  });

  getJSON("briefings/index.json").then(function (idx) {
    ids = (Array.isArray(idx && idx.issues) ? idx.issues : []).filter(isId);
    ids.sort().reverse();
    if (!ids.length) {
      pick.innerHTML = "<option>Noch leer</option>";
      showNote("Noch keine Ausgabe", "Das erste Briefing erscheint hier, sobald es im Projekt liegt.");
      return;
    }
    pick.innerHTML = ids.map(function (id) {
      return '<option value="' + esc(id) + '">' + esc(shortLabel(id)) + "</option>";
    }).join("");
    pick.disabled = false;
    var want = location.hash.slice(1);
    select(isId(want) && ids.indexOf(want) >= 0 ? want : ids[0], { fromHash: true, keepScroll: true });
  }).catch(function () {
    pick.innerHTML = "<option>–</option>";
    showNote("Briefing gerade nicht erreichbar", "Die Liste der Ausgaben konnte nicht geladen werden. Prüfe deine Verbindung und lade die Seite neu.");
  });
})();
