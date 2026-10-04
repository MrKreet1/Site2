const fs = require('node:fs');
const vm = require('node:vm');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('clinic-site/team-content.js', 'utf8'), context);
const copy = context.window.CLINIC_PAGE_CONTENT.ru;
const doctors = context.window.CLINIC_DOCTORS;
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const t = key => `<span data-i18n="${key}">${escape(copy[key])}</span>`;
const icon = id => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
let html = fs.readFileSync('clinic-site/team.html', 'utf8');
const intro = `    <nav class="wrap team-breadcrumbs" aria-label="${copy.teamBreadcrumb}" data-i18n-aria="teamBreadcrumb">
      <a href="index.html" data-i18n="teamHome">${copy.teamHome}</a><span aria-hidden="true">/</span><span aria-current="page" data-i18n="teamBreadcrumb">${copy.teamBreadcrumb}</span>
    </nav>
    <section class="wrap doctors-hero" aria-labelledby="team-title">
      <div><p class="eyebrow" data-i18n="teamEyebrow">${copy.teamEyebrow}</p>
        <h1 id="team-title">${t('teamTitle')}<span class="accent" data-i18n="teamAccent">${copy.teamAccent}</span></h1>
      </div>
      <p class="team-lead" data-i18n="teamLead">${copy.teamLead}</p>
    </section>
    <div class="team-frieze" aria-hidden="true"></div>
    <section class="section doctor-section" id="team" aria-labelledby="catalog-title">
      <div class="wrap">
        <div class="catalog-heading"><div><p class="eyebrow" data-i18n="catalogEyebrow">${copy.catalogEyebrow}</p><h2 id="catalog-title" data-i18n="catalogTitle">${copy.catalogTitle}</h2></div></div>
        <p class="demo-notice">${icon('i-doc')}${t('demoNotice')}</p>
        <div class="doctor-toolbar js-only">
          <label class="doctor-search"><span class="sr-only" data-i18n="searchLabel">${copy.searchLabel}</span>${icon('i-search')}<input type="search" id="doctor-search" placeholder="${copy.searchPlaceholder}" data-i18n-placeholder="searchPlaceholder" autocomplete="off" aria-controls="doctor-grid"></label>
          <label class="doctor-select"><span class="sr-only" data-i18n="specialtyLabel">${copy.specialtyLabel}</span><select id="doctor-specialty" aria-controls="doctor-grid"><option value="all" data-i18n="filterAll">${copy.filterAll}</option>${doctors.map(d=>`<option value="${d.id}" data-i18n="${d.id}-specialty">${d.ru.specialty}</option>`).join('')}</select></label>
          <p id="doctor-count" class="doctor-count" role="status" aria-live="polite"></p>
        </div>
        <div class="doctor-grid" id="doctor-grid">
${doctors.map((d,i)=>`          <article class="doctor-card" data-doctor="${d.id}" aria-labelledby="${d.id}-name">
            <div class="doctor-portrait"><img src="${d.photo}" alt="${copy[`${d.id}-alt`]}" data-i18n-alt="${d.id}-alt" width="1024" height="1536" ${i>2?'loading="lazy"':'loading="eager"'} decoding="async"><span class="doctor-demo" data-i18n="demoBadge">${copy.demoBadge}</span><div class="doctor-experience">${icon('i-clock')}${t('experienceLabel')}<strong data-i18n="${d.id}-experience">${d.ru.experience}</strong></div></div>
            <div class="doctor-info">
              <p class="doctor-specialty" data-i18n="${d.id}-specialty">${d.ru.specialty}</p>
              <h3 id="${d.id}-name" data-i18n="${d.id}-name">${d.ru.name}</h3>
              <p class="doctor-focus" data-i18n="${d.id}-focus">${d.ru.focus}</p>
              <dl class="doctor-facts"><div><dt data-i18n="categoryLabel">${copy.categoryLabel}</dt><dd data-i18n="${d.id}-category">${d.ru.category}</dd></div><div><dt data-i18n="languagesLabel">${copy.languagesLabel}</dt><dd data-i18n="${d.id}-languages">${d.ru.languages}</dd></div></dl>
              <details class="doctor-details"><summary>${t('aboutDoctor')}<span class="doctor-plus" aria-hidden="true">+</span></summary><div class="doctor-biography">${[['educationLabel','education'],['practiceLabel','practice'],['focusLabel','focus'],['trainingLabel','training']].map(([label,field])=>`<h4 data-i18n="${label}">${copy[label]}</h4><p data-i18n="${d.id}-${field}">${d.ru[field]}</p>`).join('')}</div></details>
              <a class="btn btn-outline doctor-book" href="index.html#appointment">${t('bookDoctor')}${icon('i-arrow')}</a>
            </div>
          </article>`).join('\n')}
        </div>
        <div id="doctor-empty" class="doctor-empty" hidden><p data-i18n="empty">${copy.empty}</p><button type="button" class="btn btn-outline" id="doctor-reset" data-i18n="reset">${copy.reset}</button></div>
      </div>
    </section>
`;
html = html.slice(0, html.indexOf('    <nav class="wrap team-breadcrumbs"')) + intro + html.slice(html.indexOf('    <section class="section team-visit-section"'));
// Refresh existing CTA and metadata from the same translation source.
html = html.replace(/(<([a-z0-9]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>)[^<]*(<\/\2>)/g, (m, open, tag, key, end) => typeof copy[key] === 'string' ? open + escape(copy[key]) + end : m);
html = html.replace(/<title>.*?<\/title>/, `<title>${copy.pageTitle}</title>`);
html = html.replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g, '$1' + copy.metaDescription);
html = html.replace(/(<meta property="og:title" content=")[^"]*/, '$1' + copy.pageTitle);
if (!html.includes('src="team.js"')) html = html.replace('<script src="app.js" defer></script>', '<script src="app.js" defer></script>\n  <script src="team.js" defer></script>');
fs.writeFileSync('clinic-site/team.html', html, 'utf8');
console.log('Rendered six static doctor profiles.');
