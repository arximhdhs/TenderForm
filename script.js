// ==========================================================================
// Tender Landing Page — Application Logic
// ==========================================================================

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Firebase Initialization
  // --------------------------------------------------------------------------

  let analytics = null;
  let db = null;
  let firebaseReady = false;

  function initFirebase() {
    const config = window.TENDER_FIREBASE_CONFIG;
    if (!config || config.apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('[Tender] Firebase config not set — running in offline mode.');
      return;
    }
    try {
      firebase.initializeApp(config);
      analytics = firebase.analytics();
      db = firebase.firestore();
      firebaseReady = true;
      console.log('[Tender] Firebase initialized.');
    } catch (err) {
      console.error('[Tender] Firebase init error:', err);
    }
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  function generateSessionId() {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || ''
    };
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // --------------------------------------------------------------------------
  // Analytics Helpers
  // --------------------------------------------------------------------------

  function logEvent(eventName, params) {
    if (analytics) {
      analytics.logEvent(eventName, params || {});
    }
    console.log('[Tender Analytics]', eventName, params || '');
  }

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const sessionId = generateSessionId();
  const utmParams = getUTMParams();

  const QUESTIONS = [
    { key: 'age_range', slideId: 'slide-0' },
    { key: 'single_status', slideId: 'slide-1' },
    { key: 'gender', slideId: 'slide-2' },
    { key: 'church_attendance', slideId: 'slide-3' }
  ];

  const answers = {};
  let currentStep = 0;
  let questionnaireStarted = false;

  // --------------------------------------------------------------------------
  // DOM References
  // --------------------------------------------------------------------------

  const heroCta = document.getElementById('heroCta');
  const stickyCta = document.getElementById('stickyCta');
  const stickyCtaBtn = document.getElementById('stickyCtaBtn');
  const questionnaireSection = document.getElementById('questionnaire');
  const questionnaireCard = document.getElementById('questionnaireCard');
  const progressBar = document.getElementById('progressBar');
  const progressLabel = document.getElementById('progressLabel');
  const progressEl = document.getElementById('progress');
  const slides = document.querySelectorAll('.slide');
  const emailForm = document.getElementById('emailForm');
  const emailInput = document.getElementById('emailInput');
  const emailError = document.getElementById('emailError');
  const emailSubmit = document.getElementById('emailSubmit');

  // --------------------------------------------------------------------------
  // Progress Bar
  // --------------------------------------------------------------------------

  function updateProgress(step, total) {
    const pct = (step / total) * 100;
    progressBar.style.setProperty('--progress', pct + '%');
    progressLabel.textContent = step + '/' + total;
    progressEl.setAttribute('aria-valuenow', step);
  }

  // --------------------------------------------------------------------------
  // Slide Management
  // --------------------------------------------------------------------------

  function showSlide(slideId) {
    slides.forEach(function (s) {
      s.classList.remove('slide--active');
    });
    var target = document.getElementById(slideId);
    if (target) {
      target.classList.add('slide--active');
    }
  }

  function goToQuestion(step) {
    currentStep = step;
    var q = QUESTIONS[step];
    updateProgress(step + 1, QUESTIONS.length);
    showSlide(q.slideId);
  }

  function showEmailCapture() {
    progressEl.classList.add('progress--hidden');
    showSlide('slide-email');
    // Focus the email input after animation
    setTimeout(function () {
      emailInput.focus();
    }, 400);
  }

  function showDisqualified() {
    progressEl.classList.add('progress--hidden');
    showSlide('slide-disqualified');
    logEvent('not_single_disqualified', { session_id: sessionId });
    // Still save partial answers
    saveToFirestore(null);
  }

  function showSuccess() {
    showSlide('slide-success');
  }

  // --------------------------------------------------------------------------
  // Option Click Handling
  // --------------------------------------------------------------------------

  function handleOptionClick(e) {
    var btn = e.target.closest('.option');
    if (!btn) return;

    var slide = btn.closest('.slide');
    var questionKey = slide.getAttribute('data-question');
    var value = btn.getAttribute('data-value');

    // Mark selected
    var options = slide.querySelectorAll('.option');
    options.forEach(function (o) {
      o.classList.remove('option--selected');
      o.setAttribute('aria-checked', 'false');
    });
    btn.classList.add('option--selected');
    btn.setAttribute('aria-checked', 'true');

    // Track
    if (!questionnaireStarted) {
      questionnaireStarted = true;
      logEvent('questionnaire_start', { session_id: sessionId });
    }

    answers[questionKey] = value;
    logEvent('question_answered', {
      session_id: sessionId,
      question: questionKey,
      answer: value
    });

    // Advance after a brief visual confirmation
    setTimeout(function () {
      advanceFromQuestion(questionKey, value);
    }, 300);
  }

  function advanceFromQuestion(questionKey, value) {
    // Special: if not single, disqualify
    if (questionKey === 'single_status' && value === 'no') {
      showDisqualified();
      hideStickyCtaCompletely();
      return;
    }

    var nextStep = currentStep + 1;
    if (nextStep < QUESTIONS.length) {
      goToQuestion(nextStep);
    } else {
      // Questionnaire complete
      logEvent('questionnaire_completed', {
        session_id: sessionId,
        ...answers
      });
      showEmailCapture();
      hideStickyCtaCompletely();
    }
  }

  // --------------------------------------------------------------------------
  // Email Submission
  // --------------------------------------------------------------------------

  function handleEmailSubmit(e) {
    e.preventDefault();

    var email = emailInput.value.trim();
    emailError.textContent = '';
    emailInput.classList.remove('email-form__input--error');

    if (!email) {
      emailError.textContent = 'Παρακαλώ εισάγετε το email σας.';
      emailInput.classList.add('email-form__input--error');
      return;
    }

    if (!isValidEmail(email)) {
      emailError.textContent = 'Παρακαλώ εισάγετε ένα έγκυρο email.';
      emailInput.classList.add('email-form__input--error');
      return;
    }

    emailSubmit.disabled = true;
    emailSubmit.textContent = 'Υποβολή...';

    saveToFirestore(email)
      .then(function () {
        logEvent('email_submitted', {
          session_id: sessionId,
          email: email
        });
        // Mark as submitted in localStorage
        try {
          localStorage.setItem('tender_submitted', 'true');
          localStorage.setItem('tender_submitted_email', email);
        } catch (e) { /* localStorage unavailable */ }
        showSuccess();
      })
      .catch(function (err) {
        console.error('[Tender] Firestore write error:', err);
        emailError.textContent = 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.';
        emailSubmit.disabled = false;
        emailSubmit.textContent = 'Μπες στη λίστα αναμονής';
      });
  }

  // --------------------------------------------------------------------------
  // Firestore Persistence
  // --------------------------------------------------------------------------

  function saveToFirestore(email) {
    var data = {
      age_range: answers.age_range || null,
      single_status: answers.single_status || null,
      gender: answers.gender || null,
      church_attendance: answers.church_attendance || null,
      email: email,
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign
    };

    if (!firebaseReady || !db) {
      console.log('[Tender] Offline mode — data:', data);
      return Promise.resolve();
    }

    return db.collection('submissions').add(data);
  }

  // --------------------------------------------------------------------------
  // CTA / Scroll Behavior
  // --------------------------------------------------------------------------

  function scrollToQuestionnaire() {
    logEvent('cta_click', { session_id: sessionId });
    questionnaireSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Sticky CTA visibility: show after scrolling past hero, hide when questionnaire is in view
  var stickyHiddenPermanently = false;

  function hideStickyCtaCompletely() {
    stickyHiddenPermanently = true;
    stickyCta.classList.add('sticky-cta--hidden');
  }

  function updateStickyCta() {
    if (stickyHiddenPermanently) return;

    var heroRect = heroCta.getBoundingClientRect();
    var qRect = questionnaireCard.getBoundingClientRect();
    var viewportH = window.innerHeight;

    // Show sticky CTA after hero CTA scrolls out of view
    var heroCtaVisible = heroRect.bottom > 0 && heroRect.top < viewportH;
    // Hide when questionnaire card is mostly visible
    var qVisible = qRect.top < viewportH * 0.7;

    if (!heroCtaVisible && !qVisible) {
      stickyCta.classList.remove('sticky-cta--hidden');
    } else {
      stickyCta.classList.add('sticky-cta--hidden');
    }
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  function init() {
    initFirebase();

    // Check if user already submitted
    try {
      if (localStorage.getItem('tender_submitted') === 'true') {
        progressEl.classList.add('progress--hidden');
        showSlide('slide-success');
        hideStickyCtaCompletely();
        logEvent('page_view', { session_id: sessionId, returning: true, ...utmParams });
        return; // Skip all other setup — already submitted
      }
    } catch (e) { /* localStorage unavailable */ }

    // Track page view
    logEvent('page_view', {
      session_id: sessionId,
      ...utmParams
    });

    // Initial state
    updateProgress(1, QUESTIONS.length);
    stickyCta.classList.add('sticky-cta--hidden');

    // Event: CTA buttons
    heroCta.addEventListener('click', scrollToQuestionnaire);
    stickyCtaBtn.addEventListener('click', scrollToQuestionnaire);

    // Event: option clicks (delegated)
    questionnaireCard.addEventListener('click', handleOptionClick);

    // Event: email form
    emailForm.addEventListener('submit', handleEmailSubmit);

    // Event: scroll — sticky CTA
    var scrollTicking = false;
    window.addEventListener('scroll', function () {
      if (!scrollTicking) {
        requestAnimationFrame(function () {
          updateStickyCta();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });

    // Keyboard: allow Enter/Space on options
    questionnaireCard.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var btn = e.target.closest('.option');
        if (btn) {
          e.preventDefault();
          btn.click();
        }
      }
    });
  }

  // Run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
