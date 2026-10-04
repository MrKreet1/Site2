(() => {
  'use strict';
  const search = document.getElementById('doctor-search');
  const specialty = document.getElementById('doctor-specialty');
  const cards = [...document.querySelectorAll('[data-doctor]')];
  const count = document.getElementById('doctor-count');
  const empty = document.getElementById('doctor-empty');
  if (!search || !specialty || !count || !empty) return;
  const normalize = text => text.toLocaleLowerCase().replaceAll('ё', 'е').trim();

  function filterDoctors() {
    const lang = document.documentElement.lang;
    const copy = window.CLINIC_PAGE_CONTENT[lang] || window.CLINIC_PAGE_CONTENT.ru;
    const words = normalize(search.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    cards.forEach(card => {
      const doctor = window.CLINIC_DOCTORS.find(item => item.id === card.dataset.doctor);
      const profile = doctor[lang] || doctor.ru;
      const haystack = normalize(`${profile.name} ${profile.specialty}`);
      const matches = (specialty.value === 'all' || specialty.value === doctor.id) && words.every(word => haystack.includes(word));
      card.hidden = !matches;
      if (matches) visible++;
    });
    count.textContent = `${copy.results}: ${visible}`;
    empty.hidden = visible > 0;
  }

  search.addEventListener('input', filterDoctors);
  specialty.addEventListener('change', filterDoctors);
  document.getElementById('doctor-reset').addEventListener('click', () => {
    search.value = '';
    specialty.value = 'all';
    filterDoctors();
    search.focus();
  });
  new MutationObserver(filterDoctors).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  filterDoctors();
})();
