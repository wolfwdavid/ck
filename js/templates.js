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

  function decorLines() {
    // Recreation of the PDF's abstract line-art "breather" page (vector in the source, no raster asset exists).
    return (
      '<svg class="decor-lines" viewBox="0 0 400 300" role="img" aria-label="Abstract geometric line illustration">' +
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
      return (
        '<figure class="media-figure">' +
        (url
          ? '<img src="' + esc(url) + '" alt="' + esc(c.caption || '') + '">'
          : decorLines()) +
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
      if (c.title) out += '<h2 class="h h--md">' + esc(c.title) + '</h2>';
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
      var out = '<h2 class="h h--md">' + esc(c.title) + '</h2>';
      (c.groups || []).forEach(function (g) {
        out += '<div class="link-group">';
        if (g.heading) out += '<h3 class="link-group__heading">' + esc(g.heading) + '</h3>';
        out += '<ul>' + (g.links || []).map(function (l) {
          return '<li>' + linkOrDisabled(l.label, l.url) + '</li>';
        }).join('') + '</ul>';
        out += '</div>';
      });
      return out;
    },

    worksheet: function (s) {
      var c = s.content || {};
      var out = '<h2 class="h h--lg">' + esc(c.title) + '</h2>';
      (c.prompts || []).forEach(function (p, i) {
        var key = 'worksheet-' + i;
        out += (
          '<div class="worksheet-prompt">' +
          '<label for="' + key + '">' + (i + 1) + '. ' + esc(p) + '</label>' +
          '<textarea id="' + key + '" data-worksheet-key="' + key + '"></textarea>' +
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
