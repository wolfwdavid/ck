// Render functions for each flipbook screen type.
// Each function receives (screen, assets) and returns an HTML string for .screen__inner's content
// (the section label + footer chrome is added by app.js, not here).
(function (global) {
  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function paragraphs(arr) {
    if (!arr || !arr.length) return '';
    return arr.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
  }

  function multiline(str) {
    if (!str) return '';
    return esc(str).split('\n').join('<br>');
  }

  // Several transcribed titles arrive as "Short Heading — long explanatory sentence"
  // (the PDF's own page intro folded into the title field). Split so the heading stays
  // a heading and the explanation reads as body copy underneath it.
  function splitTitle(title) {
    if (!title) return { heading: null, intro: null };
    var parts = title.split(/\s[—–-]\s/);
    if (parts.length < 2) return { heading: title, intro: null };
    return { heading: parts[0], intro: parts.slice(1).join(' — ') };
  }

  function linkOrDisabled(label, url, extraClass) {
    var cls = extraClass || '';
    if (url) {
      return '<a class="' + cls + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>';
    }
    return '<span class="' + cls + ' no-link" aria-disabled="true">' + esc(label) + ' <small>(link unavailable)</small></span>';
  }

  function assetUrl(assets, key) {
    if (!key || !assets || !assets[key]) return null;
    return 'assets/' + assets[key];
  }

  function decorLines(altText) {
    // Recreation of the PDF's abstract line-art "breather" page (vector in the source, no raster asset exists).
    // altText (the transcribed description of the original artwork) becomes the SVG's accessible name,
    // not visible caption text — it's describing decoration, not giving the reader new information.
    return (
      '<svg class="decor-lines" viewBox="0 0 400 300" role="img" aria-label="' + esc(altText || 'Abstract geometric line illustration') + '">' +
      '<g fill="none" stroke="#1a1a1a" stroke-width="1.4">' +
      '<polyline points="10,290 140,40 270,290" />' +
      '<polyline points="90,290 200,110 320,290" />' +
      '<line x1="10" y1="290" x2="390" y2="290" />' +
      '<circle cx="200" cy="110" r="4" fill="#1a1a1a" />' +
      '</g></svg>'
    );
  }

  var renderers = {
    cover: function (s, assets) {
      var c = s.content || {};
      var bg = assetUrl(assets, c.image) || assetUrl(assets, 'citrusTexture');
      return (
        '<div class="citrus-band" style="background-image:url(\'' + esc(bg) + '\')">' +
        '<h1 class="h h--xl">' + esc(c.title) + '</h1>' +
        (c.subtitle ? '<p class="body-text">' + multiline(c.subtitle) + '</p>' : '') +
        '</div>'
      );
    },

    divider: function (s) {
      var c = s.content || {};
      return '<h2 class="h h--lg">' + esc(c.title) + '</h2>';
    },

    essay: function (s, assets) {
      var c = s.content || {};
      var out = '';
      if (c.image) {
        var url = assetUrl(assets, c.image);
        out += url
          ? '<figure class="media-figure"><img src="' + esc(url) + '" alt="' + esc(c.imageAlt || '') + '"></figure>'
          : decorLines();
      }
      if (c.heading) out += '<h2 class="h h--md">' + esc(c.heading) + '</h2>';
      if (c.pullquote) out += '<div class="pullquote">' + esc(c.pullquote) + '</div>';
      out += '<div class="body-text">' + paragraphs(c.paragraphs) + '</div>';
      if (c.cta) {
        out += '<p>' + linkOrDisabled(c.cta.label, c.cta.url, 'shop-link') + '</p>';
      }
      return out;
    },

    quote: function (s) {
      var c = s.content || {};
      return (
        '<blockquote class="quote-text">' + esc(c.text) + '</blockquote>' +
        (c.attribution ? '<div class="quote-attribution">' + esc(c.attribution) + '</div>' : '')
      );
    },

    photo: function (s, assets) {
      var c = s.content || {};
      var url = assetUrl(assets, c.image);
      if (!url) {
        // No raster asset (e.g. the source PDF's vector line-art pages) — the caption describes the
        // artwork itself, so it belongs on the SVG as an accessible name, not as visible caption text.
        return '<figure class="media-figure">' + decorLines(c.caption) + '</figure>';
      }
      return (
        '<figure class="media-figure">' +
        '<img src="' + esc(url) + '" alt="' + esc(c.caption || '') + '">' +
        (c.caption ? '<figcaption>' + esc(c.caption) + '</figcaption>' : '') +
        '</figure>'
      );
    },

    recipe: function (s) {
      var c = s.content || {};
      var out = '<h2 class="h h--lg">' + esc(c.title) + '</h2>';
      if (c.intro) out += '<div class="body-text recipe-intro">' + paragraphs([c.intro]) + '</div>';
      (c.variants || []).forEach(function (v) {
        out += '<div class="recipe-variant">';
        if (v.name) out += '<h3 class="recipe-variant__name">' + esc(v.name) + '</h3>';
        if (v.ingredients && v.ingredients.length) {
          out += '<ul class="recipe-list recipe-list--ingredients">' +
            v.ingredients.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
        }
        if (v.steps && v.steps.length) {
          out += '<ol class="recipe-list recipe-list--steps">' +
            v.steps.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>';
        }
        if (v.tips) out += '<p class="recipe-tips">' + esc(v.tips) + '</p>';
        out += '</div>';
      });
      return out;
    },

    'pantry-letter': function (s) {
      function block(item) {
        var out = '';
        if (item.description) out += '<p class="pantry-description">' + esc(item.description) + '</p>';
        if (item.intro) out += '<p class="pantry-intro">' + esc(item.intro) + '</p>';
        if (item.uses && item.uses.length) {
          out += '<ul class="pantry-uses">' +
            item.uses.map(function (u) { return '<li>' + esc(u) + '</li>'; }).join('') + '</ul>';
        }
        if (item.also && item.also.length) {
          out += '<p class="pantry-intro">Also:</p><ul class="pantry-uses pantry-uses--also">' +
            item.also.map(function (u) { return '<li>' + esc(u) + '</li>'; }).join('') + '</ul>';
        }
        if (item.note) out += '<p class="pantry-note">' + esc(item.note) + '</p>';
        if (item.tip) out += '<p class="pantry-note">' + esc(item.tip) + '</p>';
        var links = item.shopLinks || (item.shopLink ? [item.shopLink] : []);
        if (links.length) {
          out += '<div class="shop-link-row">' +
            links.map(function (l) { return linkOrDisabled(l.label || ('Shop ' + item.item), l.url, 'shop-link'); }).join('') +
            '</div>';
        }
        return out;
      }

      var c = s.content || {};
      var out = '<div class="pantry-letter-badge">' + esc(c.letter) + '</div>';
      out += '<h2 class="pantry-item-name">' + esc(c.item) + '</h2>';
      out += block(c);
      if (c.additionalItem) {
        out += '<div class="pantry-additional-item">' +
          '<h3 class="pantry-item-name pantry-item-name--sub">' + esc(c.additionalItem.item) + '</h3>' +
          block(c.additionalItem) +
          '</div>';
      }
      return out;
    },

    table: function (s) {
      var c = s.content || {};
      var out = '';
      var t = splitTitle(c.title);
      if (t.heading) out += '<h2 class="h h--md">' + esc(t.heading) + '</h2>';
      if (t.intro) out += '<p class="body-text table-intro">' + esc(t.intro) + '</p>';
      var hasHeaders = c.headers && c.headers.length;
      out += '<div class="table-wrap"><table class="content-table">' +
        (hasHeaders
          ? '<thead><tr>' + c.headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead>'
          : '') +
        '<tbody>' +
        (c.rows || []).map(function (row) {
          return '<tr>' + row.map(function (cell) { return '<td>' + esc(cell) + '</td>'; }).join('') + '</tr>';
        }).join('') +
        '</tbody></table></div>';
      return out;
    },

    'link-list': function (s) {
      var c = s.content || {};
      var t = splitTitle(c.title);
      var out = '';
      if (t.heading) out += '<h2 class="h h--md">' + esc(t.heading) + '</h2>';
      if (t.intro) out += '<p class="body-text table-intro">' + esc(t.intro) + '</p>';
      (c.groups || []).forEach(function (g) {
        out += '<div class="link-group">';
        if (g.heading) {
          var gt = splitTitle(g.heading);
          out += '<h3 class="link-group__heading">' + esc(gt.heading) + '</h3>';
          if (gt.intro) out += '<p class="body-text table-intro">' + esc(gt.intro) + '</p>';
        }
        out += '<ul>' + (g.links || []).map(function (l) {
          return '<li>' + linkOrDisabled(l.label, l.url) + '</li>';
        }).join('') + '</ul>';
        out += '</div>';
      });
      return out;
    },

    worksheet: function (s) {
      var c = s.content || {};
      var t = splitTitle(c.title);
      var out = '';
      if (t.heading) out += '<h2 class="h h--lg">' + esc(t.heading) + '</h2>';
      if (t.intro) out += '<p class="body-text table-intro">' + esc(t.intro) + '</p>';
      (c.prompts || []).forEach(function (p, i) {
        var key = 'worksheet-' + i;
        var labelText = p ? (i + 1) + '. ' + esc(p) : (i + 1) + '.';
        out += (
          '<div class="worksheet-prompt">' +
          '<label for="' + key + '">' + labelText + '</label>' +
          '<textarea id="' + key + '" data-worksheet-key="' + key + '" placeholder="Your last non-vegan …"></textarea>' +
          '</div>'
        );
      });
      out += '<div class="worksheet-saved-note" data-worksheet-note></div>';
      return out;
    },

    bio: function (s, assets) {
      var c = s.content || {};
      var url = assetUrl(assets, c.image);
      var out = '';
      if (url) out += '<figure class="media-figure"><img src="' + esc(url) + '" alt="' + esc(c.heading || 'Author photo') + '"></figure>';
      if (c.heading) out += '<h2 class="h h--md">' + esc(c.heading) + '</h2>';
      out += '<div class="body-text">' + paragraphs(c.paragraphs) + '</div>';
      if (c.email) out += '<p><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></p>';
      return out;
    },

    closing: function (s) {
      var c = s.content || {};
      return '<div class="body-text">' + paragraphs([c.text]) + '</div>';
    }
  };

  global.FlipbookTemplates = {
    render: function (screen, assets) {
      var fn = renderers[screen.type];
      if (!fn) return '<p class="body-text">Unknown screen type: ' + esc(screen.type) + '</p>';
      return fn(screen, assets || {});
    }
  };
})(window);
