const navToggle = document.querySelector("[data-nav-toggle]");
const navLinks = document.querySelectorAll(".site-nav a");
const newsletterModal = document.querySelector("[data-newsletter-modal]");
const newsletterPanel = newsletterModal?.querySelector(".newsletter-modal__panel");
const newsletterOpeners = document.querySelectorAll("[data-newsletter-open]");
const newsletterClosers = document.querySelectorAll("[data-newsletter-close]");
const newsletterForm = document.querySelector("[data-newsletter-form]");
const newsletterSuccess = document.querySelector("[data-newsletter-success]");
const newsletterStatus = document.querySelector("[data-newsletter-status]");
const newsletterEmail = document.querySelector("#newsletter-email");
const newsletterCopyButton = document.querySelector("[data-copy-code]");
const newsletterCopyStatus = document.querySelector("[data-copy-status]");
const newsletterCouponCode = "LAYERO10";
const newsletterSubscribedKey = "layero-newsletter-subscribed";
const newsletterDismissedKey = "layero-newsletter-dismissed";
const newsletterAutoShownKey = "layero-newsletter-auto-shown";
let newsletterLastActiveElement = null;

document.documentElement.classList.add("js-enabled");

function setNavOpen(isOpen) {
  document.body.classList.toggle("nav-open", isOpen);
  navToggle?.setAttribute("aria-expanded", String(isOpen));
}

navToggle?.addEventListener("click", () => {
  setNavOpen(!document.body.classList.contains("nav-open"));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => setNavOpen(false));
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && isNewsletterOpen()) {
    trapNewsletterFocus(event);
    return;
  }

  if (event.key === "Escape") {
    if (isNewsletterOpen()) {
      closeNewsletter();
      return;
    }

    setNavOpen(false);
  }
});

function getStored(storage, key) {
  try {
    return storage.getItem(key);
  } catch (error) {
    return null;
  }
}

function setStored(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch (error) {
    // Storage can fail in restricted browser modes; the popup still works.
  }
}

function isNewsletterOpen() {
  return Boolean(newsletterModal && !newsletterModal.hidden);
}

function hasNewsletterSubscription() {
  return Boolean(getStored(window.localStorage, newsletterSubscribedKey));
}

function setNewsletterView() {
  if (!newsletterForm || !newsletterSuccess) {
    return;
  }

  const isSubscribed = hasNewsletterSubscription();
  newsletterForm.hidden = isSubscribed;
  newsletterSuccess.hidden = !isSubscribed;

  if (newsletterStatus) {
    newsletterStatus.textContent = "";
  }

  if (newsletterCopyStatus) {
    newsletterCopyStatus.textContent = "";
  }
}

function openNewsletter({ auto = false } = {}) {
  if (!newsletterModal) {
    return;
  }

  newsletterLastActiveElement = document.activeElement;
  setNavOpen(false);
  setNewsletterView();
  newsletterModal.hidden = false;
  document.body.classList.add("newsletter-open");

  if (auto) {
    setStored(window.sessionStorage, newsletterAutoShownKey, "1");
  }

  window.setTimeout(() => {
    const focusTarget = hasNewsletterSubscription()
      ? newsletterCopyButton
      : newsletterEmail;

    (focusTarget || newsletterPanel)?.focus();
  }, 40);
}

function closeNewsletter() {
  if (!newsletterModal || newsletterModal.hidden) {
    return;
  }

  newsletterModal.hidden = true;
  document.body.classList.remove("newsletter-open");
  setStored(window.sessionStorage, newsletterDismissedKey, "1");

  if (
    newsletterLastActiveElement &&
    typeof newsletterLastActiveElement.focus === "function"
  ) {
    newsletterLastActiveElement.focus();
  }
}

function getNewsletterFocusableElements() {
  if (!newsletterModal) {
    return [];
  }

  return [
    ...newsletterModal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ),
  ].filter((element) => {
    const isInsideHiddenParent = element.closest("[hidden]");
    return !isInsideHiddenParent && element.offsetParent !== null;
  });
}

function trapNewsletterFocus(event) {
  const focusableElements = getNewsletterFocusableElements();

  if (!focusableElements.length) {
    event.preventDefault();
    newsletterPanel?.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function shouldAutoOpenNewsletter() {
  return (
    newsletterModal &&
    !hasNewsletterSubscription() &&
    !getStored(window.sessionStorage, newsletterDismissedKey) &&
    !getStored(window.sessionStorage, newsletterAutoShownKey)
  );
}

function scheduleNewsletterPopup() {
  if (!shouldAutoOpenNewsletter()) {
    return;
  }

  window.setTimeout(() => {
    if (shouldAutoOpenNewsletter() && !document.body.classList.contains("nav-open")) {
      openNewsletter({ auto: true });
    }
  }, 3800);

  const handleNewsletterScroll = () => {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;

    if (scrollProgress > 0.42 && shouldAutoOpenNewsletter()) {
      openNewsletter({ auto: true });
      window.removeEventListener("scroll", handleNewsletterScroll);
    }
  };

  window.addEventListener("scroll", handleNewsletterScroll, { passive: true });
}

function fallbackCopyCoupon() {
  const textarea = document.createElement("textarea");
  textarea.value = newsletterCouponCode;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
    return true;
  } catch (error) {
    return false;
  } finally {
    textarea.remove();
  }
}

newsletterOpeners.forEach((opener) => {
  opener.addEventListener("click", () => openNewsletter());
});

newsletterClosers.forEach((closer) => {
  closer.addEventListener("click", () => closeNewsletter());
});

newsletterForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!newsletterForm.checkValidity()) {
    if (newsletterStatus) {
      newsletterStatus.textContent =
        "K\u00e9rj\u00fck add meg az email c\u00edmed, \u00e9s fogadd el a h\u00edrlev\u00e9l felt\u00e9teleit.";
    }

    newsletterForm.reportValidity();
    return;
  }

  const formData = new FormData(newsletterForm);
  const subscription = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    coupon: newsletterCouponCode,
    subscribedAt: new Date().toISOString(),
  };

  setStored(window.localStorage, newsletterSubscribedKey, JSON.stringify(subscription));
  setStored(window.sessionStorage, newsletterDismissedKey, "1");

  newsletterForm.reset();
  setNewsletterView();
  newsletterCopyButton?.focus();
});

newsletterCopyButton?.addEventListener("click", async () => {
  let copied = false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(newsletterCouponCode);
      copied = true;
    } catch (error) {
      copied = fallbackCopyCoupon();
    }
  } else {
    copied = fallbackCopyCoupon();
  }

  if (newsletterCopyStatus) {
    newsletterCopyStatus.textContent = copied
      ? "Kuponk\u00f3d kim\u00e1solva."
      : "A kuponk\u00f3d: " + newsletterCouponCode;
  }
});

scheduleNewsletterPopup();

const knowledgeFilterButtons = [...document.querySelectorAll("[data-knowledge-filter]")];
const knowledgeCards = [...document.querySelectorAll("[data-knowledge-card]")];
const knowledgeGrid = document.querySelector("[data-knowledge-grid]");
const knowledgeFilterStatus = document.querySelector("[data-knowledge-filter-status]");

if (knowledgeFilterButtons.length && knowledgeCards.length) {
  const knowledgeCategories = new Set(
    knowledgeFilterButtons
      .map((button) => button.dataset.knowledgeFilter)
      .filter((category) => category && category !== "all")
  );

  const getKnowledgeCategories = (card) =>
    String(card.dataset.knowledgeCategories || "")
      .split(/\s+/)
      .filter(Boolean);

  const getFilterFromHash = () => {
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));

    if (hash === "osszes-bejegyzes") {
      return "all";
    }

    return knowledgeCategories.has(hash) ? hash : null;
  };

  const updateKnowledgeHash = (filter) => {
    const nextHash = filter === "all" ? "osszes-bejegyzes" : filter;
    const nextUrl = `${window.location.pathname}${window.location.search}#${nextHash}`;

    if (window.location.hash !== `#${nextHash}`) {
      window.history.replaceState(null, "", nextUrl);
    }
  };

  const setKnowledgeFilter = (filter, { updateHash = true } = {}) => {
    const activeFilter = filter === "all" || knowledgeCategories.has(filter) ? filter : "all";
    let visibleCount = 0;

    knowledgeFilterButtons.forEach((button) => {
      const isActive = button.dataset.knowledgeFilter === activeFilter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    knowledgeCards.forEach((card) => {
      const isVisible =
        activeFilter === "all" || getKnowledgeCategories(card).includes(activeFilter);

      card.hidden = !isVisible;
      card.classList.toggle("is-filtered-out", !isVisible);

      if (isVisible) {
        visibleCount += 1;
        card.classList.add("is-visible");
      }
    });

    knowledgeGrid?.setAttribute("data-active-filter", activeFilter);

    if (knowledgeFilterStatus) {
      knowledgeFilterStatus.textContent = `${visibleCount} bejegyz\u00e9s l\u00e1that\u00f3.`;
    }

    if (updateHash) {
      updateKnowledgeHash(activeFilter);
    }
  };

  knowledgeFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setKnowledgeFilter(button.dataset.knowledgeFilter || "all");
    });
  });

  window.addEventListener("hashchange", () => {
    const hashFilter = getFilterFromHash();

    if (hashFilter) {
      setKnowledgeFilter(hashFilter, { updateHash: false });
    }
  });

  setKnowledgeFilter(getFilterFromHash() || "all", { updateHash: false });
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealSelector = [
  ".statement .eyebrow",
  ".statement h2",
  ".statement__body",
  ".statement__visual",
  ".services .section-title",
  ".service-card",
  ".how-command__origin",
  ".how-command__badge",
  ".how-command__map",
  ".how-command__header h2",
  ".how-command__header > p",
  ".how-command__step",
  ".how-command__divider",
  ".how-command__benefit",
  ".how-command__cta",
  ".gallery .eyebrow",
  ".gallery-card",
  ".gallery__note",
  ".monthly-creation__panel",
  ".monthly-creation__more",
  ".process .eyebrow",
  ".process__panel",
  ".process-step",
  ".final-cta__panel",
  ".final-cta__panel > *",
  ".subpage-hero__copy > *",
  ".subpage-hero__media",
  ".subpage-heading",
  ".mini-title",
  ".mini-copy",
  ".page-card",
  ".feature-band",
  ".feature-band__item",
  ".split-section > *",
  ".process-node",
  ".faq-list details",
  ".wide-cta",
  ".article-category",
  ".knowledge-feature > *",
  ".knowledge-chip",
  ".knowledge-card",
  ".knowledge-duo > *",
  ".knowledge-newsletter > *",
  ".contact-panel",
  ".site-footer .footer__brand",
  ".site-footer .footer__links",
  ".site-footer .footer__contact",
  ".site-footer .footer__bottom",
].join(", ");

const revealGroups = [
  ...document.querySelectorAll(".statement, .services, .how-command, .gallery, .process, .final-cta, .subpage-main, .site-footer"),
];

const revealItems = revealGroups.flatMap((group) =>
  [...group.querySelectorAll(revealSelector)].map((item, index) => {
    item.classList.add("reveal-item");
    item.style.setProperty("--reveal-delay", `${Math.min(index * 70, 420)}ms`);

    if (
      item.matches(".service-card, .how-command__step, .how-command__benefit, .gallery-card, .process__panel, .final-cta__panel")
      || item.matches(".page-card, .feature-band, .wide-cta, .contact-panel")
    ) {
      item.classList.add("reveal-card");
    }

    return item;
  })
);

if (prefersReducedMotion) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px 12% 0px",
      threshold: 0.04,
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  const revealVisibleItems = () => {
    revealItems.forEach((item) => {
      const rect = item.getBoundingClientRect();

      if (rect.top < window.innerHeight * 0.96 && rect.bottom > 0) {
        item.classList.add("is-visible");
      }
    });
  };

  window.addEventListener("load", () => window.requestAnimationFrame(revealVisibleItems));
  window.addEventListener("hashchange", () => window.requestAnimationFrame(revealVisibleItems));
  window.requestAnimationFrame(revealVisibleItems);
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
