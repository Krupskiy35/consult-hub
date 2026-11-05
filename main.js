
(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');

  const setMenu = open => {
    nav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  };

  menuButton.addEventListener('click', () =>
      setMenu(menuButton.getAttribute('aria-expanded') !== 'true')
  );

  nav.querySelectorAll('a').forEach(link =>
      link.addEventListener('click', () => setMenu(false))
  );

  const languageButton = document.querySelector('.lang-toggle');
  const languageOptions = document.querySelector('.lang-options');

  const setLanguageOpen = open => {
    languageOptions.hidden = !open;
    languageButton.setAttribute('aria-expanded', String(open));
  };

  languageButton.addEventListener('click', () =>
      setLanguageOpen(languageOptions.hidden)
  );

  languageOptions.querySelectorAll('[data-lang]').forEach(button =>
      button.addEventListener('click', () => {
        setLanguageOpen(false);
        alert(
            'Переклад ' + button.dataset.lang.toUpperCase() +
            ' ще не підключено. У WordPress для реальних мовних версій використайте Polylang.'
        );
      })
  );

  document.addEventListener('click', e => {
    if (!e.target.closest('.language')) setLanguageOpen(false);

    if (
        window.innerWidth <= 850 &&
        !e.target.closest('.nav') &&
        !e.target.closest('.menu-toggle')
    ) {
      setMenu(false);
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      setMenu(false);
      setLanguageOpen(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 850) setMenu(false);
  });

  const reveals = document.querySelectorAll('.reveal');

  if (
      'IntersectionObserver' in window &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const observer = new IntersectionObserver(
        entries => entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        }),
        {
          threshold: 0.08,
          rootMargin: '0px 0px -25px 0px'
        }
    );

    reveals.forEach(item => observer.observe(item));
  } else {
    reveals.forEach(item => item.classList.add('visible'));
  }

  document.querySelector('#contact-form').addEventListener('submit', e => {
    e.preventDefault();
    document.querySelector('#form-status').textContent =
        'Форма працює у демонстраційному режимі. Для надсилання потрібно підключити серверний обробник або CRM.';
  });
})();





// CONSULT HUB — BACK TO TOP

document.addEventListener("DOMContentLoaded", () => {
  const backToTop = document.getElementById("backToTop");

  if (!backToTop) return;

  const toggleBackToTop = () => {
    const visible = window.scrollY > 400;

    backToTop.classList.toggle("is-visible", visible);
    backToTop.tabIndex = visible ? 0 : -1;
  };

  window.addEventListener("scroll", toggleBackToTop, {
    passive: true
  });

  toggleBackToTop();

  backToTop.addEventListener("click", () => {
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "instant" : "smooth"
    });
  });
});





/* CONSULT HUB — COOKIE CONSENT */

function initCookieConsent() {
  const KEY = 'consult_hub_cookie_consent_v1';

  const banner = document.getElementById('cookie-banner');
  const settings = document.getElementById('cookie-settings');
  const reopen = document.getElementById('cookie-reopen');
  const analytics = document.getElementById('cookie-analytics');
  const marketing = document.getElementById('cookie-marketing');
  const customize = document.getElementById('cookie-customize');

  if (!banner || !settings || !reopen ||
      !analytics || !marketing || !customize) return;

  function readConsent() {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  }

  function saveConsent(analyticsAllowed, marketingAllowed) {
    const consent = {
      necessary: true,
      analytics: analyticsAllowed,
      marketing: marketingAllowed,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(KEY, JSON.stringify(consent));
    } catch (error) {
      console.warn('Cookie consent could not be saved', error);
    }

    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
      detail: consent
    }));

    banner.hidden = true;
    reopen.hidden = false;
    settings.hidden = true;
    customize.textContent = 'Налаштувати';
  }

  function openSettings() {
    const saved = readConsent();
    analytics.checked = saved?.analytics === true;
    marketing.checked = saved?.marketing === true;
    settings.hidden = false;
    customize.textContent = 'Зберегти вибір';
  }

  document.getElementById('cookie-accept')
      .addEventListener('click', () => saveConsent(true, true));

  document.getElementById('cookie-reject')
      .addEventListener('click', () => saveConsent(false, false));

  customize.addEventListener('click', () => {
    if (settings.hidden) {
      openSettings();
    } else {
      saveConsent(analytics.checked, marketing.checked);
    }
  });

  document.getElementById('cookie-close')
      .addEventListener('click', () => {
        banner.hidden = true;
        reopen.hidden = false;
        // Closing does not grant consent.
      });

  reopen.addEventListener('click', () => {
    banner.hidden = false;
    reopen.hidden = true;
    openSettings();
  });

  const saved = readConsent();

  if (saved) {
    banner.hidden = true;
    reopen.hidden = false;
  } else {
    banner.hidden = false;
    reopen.hidden = true;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCookieConsent);
} else {
  initCookieConsent();
}



/* CONSULT HUB — CUSTOM CURSOR */

(() => {
  const cursor = document.querySelector(".custom-cursor");

  const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
  );

  if (!cursor || !finePointer.matches) return;

  let mouseX = -100;
  let mouseY = -100;
  let cursorX = -100;
  let cursorY = -100;

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.22;
    cursorY += (mouseY - cursorY) * 0.22;

    cursor.style.transform = `
            translate3d(
                calc(${cursorX}px - 50%),
                calc(${cursorY}px - 50%),
                0
            )
        `;

    requestAnimationFrame(animateCursor);
  }

  document.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;

    mouseX = event.clientX;
    mouseY = event.clientY;

    cursor.style.opacity = "1";
  });

  document.addEventListener("pointerover", (event) => {
    if (event.target.closest(
        "a, button, input, select, textarea, [role='button']"
    )) {
      cursor.classList.add("is-hover");
    }
  });

  document.addEventListener("pointerout", (event) => {
    if (event.target.closest(
        "a, button, input, select, textarea, [role='button']"
    )) {
      cursor.classList.remove("is-hover");
    }
  });

  document.addEventListener("pointerleave", () => {
    cursor.style.opacity = "0";
  });

  animateCursor();
})();
