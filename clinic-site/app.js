(() => {
  'use strict';

  const content = window.CLINIC_CONTENT;
  if (!content || !content.ru) return;

  const root = document.documentElement;
  const menu = document.getElementById('site-nav');
  const toggle = document.getElementById('menu-toggle');
  const themeToggle = document.getElementById('theme-toggle');
  const metaThemeColor = document.getElementById('meta-theme-color');
  const select = document.getElementById('service-select');
  const cards = [...document.querySelectorAll('.service-card[data-category]')];
  const modal = document.getElementById('service-modal');
  const toast = document.getElementById('toast');
  const speedDial = document.getElementById('speed-dial');
  const speedDialTrigger = document.getElementById('speed-dial-trigger');
  const patientPhone = document.getElementById('patient-phone');
  const appointmentDate = document.getElementById('appointment-date');
  const appointmentForm = document.getElementById('appointment-form');

  let language = 'ru';
  let activeFilter = 'all';
  let activeModalIndex = null;
  let toastTimer = null;

  /* Toast Notification */
  function showToast(text, duration = 3000) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  /* Theme Support */
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#22180D' : '#F7F3EA');
    }
    document.querySelectorAll('[data-set-theme]').forEach(btn => {
      const active = btn.dataset.setTheme === theme;
      btn.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem('umai-theme', theme); } catch (_) {}
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('umai-theme'); } catch (_) {}
    if (saved === 'dark') {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
  }

  document.querySelectorAll('[data-set-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.setTheme;
      applyTheme(next);
      const text = content[language];
      const toastMsg = next === 'light' ? text.themeToastLight : text.themeToastDark;
      showToast(toastMsg, 1800);
    });
  });

  /* Mobile Navigation Menu */
  function closeMenu(restoreFocus = false) {
    if (!menu || !toggle) return;
    menu.removeAttribute('data-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', content[language].menuOpen);
    if (restoreFocus) toggle.focus();
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      menu.dataset.open = String(open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', content[language][open ? 'menuClose' : 'menuOpen']);
    });
  }

  if (menu) {
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      closeMenu();
    }));
  }

  /* Services Filter */
  function filterServices(filter = activeFilter) {
    activeFilter = filter;
    let visible = 0;

    cards.forEach(card => {
      const isVisible = activeFilter === 'all' || card.dataset.category === activeFilter;
      card.hidden = !isVisible;
      if (isVisible) visible++;
    });

    document.querySelectorAll('[data-filter]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter));
    });

    const statusEl = document.getElementById('filter-status');
    if (statusEl) {
      statusEl.textContent = `${content[language].resultsLabel}: ${visible}`;
    }
  }

  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      filterServices(button.dataset.filter);
    });
  });

  /* Service Details Modal */
  function openServiceModal(index) {
    if (!modal) return;
    activeModalIndex = index;
    const text = content[language];
    const details = text.serviceDetails[index];
    const serviceName = text.services[index];
    const serviceCard = cards[index];

    // Icon clone
    const symbolSvg = serviceCard ? serviceCard.querySelector('.service-symbol').innerHTML : '';
    const modalIcon = document.getElementById('modal-service-icon');
    if (modalIcon && symbolSvg) modalIcon.innerHTML = symbolSvg;

    const titleEl = document.getElementById('modal-service-title');
    if (titleEl) titleEl.textContent = serviceName;

    const descEl = document.getElementById('modal-service-desc');
    if (descEl) descEl.textContent = details.fullDesc;

    const includedList = document.getElementById('modal-service-included');
    if (includedList) {
      includedList.innerHTML = '';
      details.included.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg><span>${item}</span>`;
        includedList.appendChild(li);
      });
    }

    const indicationsEl = document.getElementById('modal-service-indications');
    if (indicationsEl) indicationsEl.textContent = details.indications;

    const prepEl = document.getElementById('modal-service-prep');
    if (prepEl) prepEl.textContent = details.prep;

    modal.removeAttribute('hidden');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeServiceModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    setTimeout(() => {
      modal.setAttribute('hidden', '');
      document.body.style.overflow = '';
      activeModalIndex = null;
    }, 200);
  }

  document.querySelectorAll('[data-service-more]').forEach(button => {
    button.addEventListener('click', () => {
      const idx = Number(button.dataset.serviceMore);
      openServiceModal(idx);
    });
  });

  const modalCloseBtn = document.getElementById('modal-close');
  const modalDismissBtn = document.getElementById('modal-dismiss');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeServiceModal);
  if (modalDismissBtn) modalDismissBtn.addEventListener('click', closeServiceModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeServiceModal();
    });
  }

  const modalBookBtn = document.getElementById('modal-book-btn');
  if (modalBookBtn) {
    modalBookBtn.addEventListener('click', () => {
      if (activeModalIndex !== null && select) {
        select.selectedIndex = activeModalIndex + 1;
      }
      closeServiceModal();
      const appSection = document.getElementById('appointment');
      if (appSection) {
        appSection.scrollIntoView({ behavior: 'smooth' });
        const nameInput = document.getElementById('patient-name');
        if (nameInput) setTimeout(() => nameInput.focus({ preventScroll: true }), 400);
      }
    });
  }

  /* Card "Записаться" click handler */
  document.querySelectorAll('[data-service]').forEach(link => {
    link.addEventListener('click', () => {
      const idx = Number(link.dataset.service);
      if (select) {
        select.selectedIndex = idx + 1;
        const nameInput = document.getElementById('patient-name');
        if (nameInput) setTimeout(() => nameInput.focus({ preventScroll: true }), 400);
      }
      closeMenu();
    });
  });

  /* Speed Dial Quick Contact Widget */
  if (speedDialTrigger && speedDial) {
    speedDialTrigger.addEventListener('click', () => {
      speedDial.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!speedDial.contains(e.target)) {
        speedDial.classList.remove('open');
      }
    });
  }

  /* Phone input mask (+7 (XXX) XXX-XX-XX) */
  if (patientPhone) {
    patientPhone.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.startsWith('7') || val.startsWith('8')) {
        val = val.substring(1);
      }
      let formatted = '+7';
      if (val.length > 0) {
        formatted += ' (' + val.substring(0, 3);
      }
      if (val.length >= 4) {
        formatted += ') ' + val.substring(3, 6);
      }
      if (val.length >= 7) {
        formatted += '-' + val.substring(6, 8);
      }
      if (val.length >= 9) {
        formatted += '-' + val.substring(8, 10);
      }
      e.target.value = formatted;
    });
  }

  /* Min date for booking = today */
  if (appointmentDate) {
    const today = new Date().toISOString().split('T')[0];
    appointmentDate.setAttribute('min', today);
  }

  /* Interactive Appointment Form Submission */
  if (appointmentForm) {
    appointmentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = content[language];
      const serviceIdx = select ? select.selectedIndex : 0;
      const serviceName = serviceIdx > 0 && text.services[serviceIdx - 1] ? text.services[serviceIdx - 1] : text.servicePlaceholder;

      const nameVal = document.getElementById('patient-name')?.value.trim() || '';
      const phoneVal = document.getElementById('patient-phone')?.value.trim() || '';
      const dateVal = document.getElementById('appointment-date')?.value || '';
      const timeSelect = document.getElementById('appointment-time');
      const timeVal = timeSelect ? timeSelect.value : '';
      const notesVal = document.getElementById('patient-notes')?.value.trim() || '';

      let message = '';
      if (language === 'kk') {
        message = 'Сәлеметсіз бе! UMAI CLINIC қабылдауына жазылғым келеді.\n';
        message += `• Бағыт: ${serviceName}\n`;
        if (nameVal) message += `• Пациент: ${nameVal}\n`;
        if (phoneVal) message += `• Телефон: ${phoneVal}\n`;
        if (dateVal) message += `• Қажетті күн: ${dateVal} (${timeVal})\n`;
        if (notesVal) message += `• Өтініш: ${notesVal}\n`;
        message += 'Қабылдау уақыты мен құнын растауыңызды сұраймын.';
      } else if (language === 'en') {
        message = 'Hello! I would like to book an appointment at UMAI CLINIC.\n';
        message += `• Service: ${serviceName}\n`;
        if (nameVal) message += `• Patient: ${nameVal}\n`;
        if (phoneVal) message += `• Phone: ${phoneVal}\n`;
        if (dateVal) message += `• Preferred date: ${dateVal} (${timeVal})\n`;
        if (notesVal) message += `• Notes: ${notesVal}\n`;
        message += 'Please confirm available time slots and pricing.';
      } else {
        message = 'Здравствуйте! Хочу записаться на приём в UMAI CLINIC.\n';
        message += `• Направление: ${serviceName}\n`;
        if (nameVal) message += `• Пациент: ${nameVal}\n`;
        if (phoneVal) message += `• Телефон: ${phoneVal}\n`;
        if (dateVal) message += `• Желаемая дата: ${dateVal} (${timeVal})\n`;
        if (notesVal) message += `• Пожелания: ${notesVal}\n`;
        message += 'Подскажите, пожалуйста, доступное время приёма и стоимость.';
      }

      showToast(text.toastBooking, 2500);

      const targetUrl = `https://wa.me/77024168469?text=${encodeURIComponent(message)}`;
      setTimeout(() => {
        window.open(targetUrl, '_blank', 'noopener');
      }, 350);
    });
  }

  /* Real-time schedule & clinic open/closed status (Almaty time: UTC+5) */
  function isClinicOpen(date = new Date()) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Almaty',
        hour12: false,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric'
      });
      const parts = formatter.formatToParts(date);
      const map = {};
      parts.forEach(p => { map[p.type] = p.value; });
      const weekday = map.weekday;
      const hour = parseInt(map.hour, 10);
      const minute = parseInt(map.minute, 10);
      const m = hour * 60 + minute;
      if (['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday)) {
        return m >= 8 * 60 && m < 18 * 60;
      }
      if (weekday === 'Sat') {
        return m >= 9 * 60 && m < 15 * 60;
      }
      return false;
    } catch (_) {
      const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
      const almatyDate = new Date(utcTime + (5 * 3600000));
      const day = almatyDate.getDay();
      const m = almatyDate.getHours() * 60 + almatyDate.getMinutes();
      if (day >= 1 && day <= 5) return m >= 8 * 60 && m < 18 * 60;
      if (day === 6) return m >= 9 * 60 && m < 15 * 60;
      return false;
    }
  }

  function updateClinicStatus(lang) {
    const statusEl = document.getElementById('topline-status');
    if (!statusEl) return;
    const currentLang = lang || language || 'ru';
    const text = content[currentLang] || content.ru;
    const open = isClinicOpen();
    if (open) {
      statusEl.classList.remove('is-closed');
      statusEl.textContent = text.statusOpen || 'Открыто';
      statusEl.setAttribute('aria-label', text.statusOpen || 'Открыто');
    } else {
      statusEl.classList.add('is-closed');
      statusEl.textContent = text.statusClosed || 'Закрыто';
      statusEl.setAttribute('aria-label', text.statusClosed || 'Закрыто');
    }
  }

  /* Language Switcher */
  function setLanguage(next) {
    if (!Object.prototype.hasOwnProperty.call(content, next)) return;
    language = next;
    const text = { ...content[next], ...window.CLINIC_PAGE_CONTENT?.[next] };
    root.lang = next;
    document.title = text.pageTitle;

    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) descEl.content = text.metaDescription;

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = text.pageTitle;

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = text.metaDescription;

    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.content = { ru: 'ru_RU', kk: 'kk_KZ', en: 'en_US' }[next];

    // Text translations
    document.querySelectorAll('[data-i18n]').forEach(element => {
      if (element.id === 'topline-status') return;
      const value = text[element.dataset.i18n];
      if (typeof value === 'string') element.textContent = value;
    });

    updateClinicStatus(next);

    // Alt text translations
    document.querySelectorAll('[data-i18n-alt]').forEach(element => {
      const value = text[element.dataset.i18nAlt];
      if (typeof value === 'string') element.alt = value;
    });

    // Aria labels
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const value = text[element.dataset.i18nAria];
      if (typeof value === 'string') element.setAttribute('aria-label', value);
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const value = text[element.dataset.i18nPlaceholder];
      if (typeof value === 'string') element.placeholder = value;
    });

    // Service cards
    cards.forEach((card, index) => {
      const heading = card.querySelector('h3');
      if (heading && text.services[index]) heading.textContent = text.services[index];

      const desc = card.querySelector('p');
      if (desc && text.serviceDescriptions[index]) desc.textContent = text.serviceDescriptions[index];

      const moreBtn = card.querySelector('[data-service-more]');
      if (moreBtn) moreBtn.textContent = text.serviceMore;

      const bookBtn = card.querySelector('[data-service]');
      if (bookBtn) {
        bookBtn.querySelector('span').textContent = text.serviceBook;
        bookBtn.setAttribute('aria-label', `${text.serviceBook}: ${text.services[index]}`);
      }
    });

    // Form select options
    if (select) {
      [...select.options].forEach((option, index) => {
        option.textContent = index === 0 ? text.servicePlaceholder : text.services[index - 1];
        option.value = text.messages[index];
      });
    }

    // FAQ details
    document.querySelectorAll('.faq-list details').forEach((item, index) => {
      if (text.faq[index]) {
        item.querySelector('summary').textContent = text.faq[index].q;
        item.querySelector('p').textContent = text.faq[index].a;
      }
    });

    // Modal refresh if open
    if (modal && modal.classList.contains('open') && activeModalIndex !== null) {
      openServiceModal(activeModalIndex);
    }

    // Active language buttons
    document.querySelectorAll('[data-lang]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === next));
    });

    if (toggle) {
      toggle.setAttribute('aria-label', text[toggle.getAttribute('aria-expanded') === 'true' ? 'menuClose' : 'menuOpen']);
    }

    filterServices();

    try { localStorage.setItem('umai-lang', next); } catch (_) {}
  }

  document.querySelectorAll('[data-lang]').forEach(button => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  });

  // Global Keydown (Escape closes modal, menu, speed dial)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (modal && modal.classList.contains('open')) {
        closeServiceModal();
      } else if (toggle && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu(true);
      } else if (speedDial && speedDial.classList.contains('open')) {
        speedDial.classList.remove('open');
      }
    }
  });

  document.addEventListener('click', (event) => {
    if (toggle && toggle.getAttribute('aria-expanded') === 'true' && !event.target.closest('.site-header')) {
      closeMenu();
    }
  });

  const desktop = window.matchMedia('(min-width: 901px)');
  desktop.addEventListener('change', () => closeMenu());

  function measureFixedElements() {
    const header = document.querySelector('.site-header');
    if (header) {
      root.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    }
    const bar = document.querySelector('.mobile-bar');
    if (bar) {
      root.style.setProperty('--mobile-bar-height', `${Math.ceil(bar.getBoundingClientRect().height)}px`);
    }
  }

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(measureFixedElements);
    const header = document.querySelector('.site-header');
    const bar = document.querySelector('.mobile-bar');
    if (header) observer.observe(header);
    if (bar) observer.observe(bar);
  } else {
    window.addEventListener('resize', measureFixedElements);
  }

  /* Initialization */
  initTheme();
  let initialLang = 'ru';
  try {
    const saved = localStorage.getItem('umai-lang');
    if (saved && Object.prototype.hasOwnProperty.call(content, saved)) initialLang = saved;
  } catch (_) {}

  setLanguage(initialLang);
  setInterval(() => updateClinicStatus(language), 60000);
  root.classList.add('js');
  measureFixedElements();
})();
