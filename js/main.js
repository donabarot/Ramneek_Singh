document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealItems = document.querySelectorAll(
    '.section-head, .home-about-copy, .video-card, .repertoire-card, .frame, .heritage-copy p, .heritage-quote, .concert-card, .contact-card'
  );

  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealItems.forEach(function (item, index) {
      item.setAttribute('data-motion-reveal', '');
      item.style.setProperty('--reveal-delay', (index % 4) * 90 + 'ms');
    });

    document.body.classList.add('motion-ready');
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -36px 0px' });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  }

  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  document.body.appendChild(progress);

  var progressFill = progress.firstElementChild;
  var scrollFrame = null;
  function updateScrollEffects() {
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var amount = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressFill.style.transform = 'scaleX(' + Math.max(0, Math.min(1, amount)) + ')';

    var hero = document.querySelector('.hero-cinematic');
    if (hero) {
      var bounds = hero.getBoundingClientRect();
      var offset = Math.max(-18, Math.min(18, -bounds.top * 0.035));
      hero.style.setProperty('--parallax-y', offset.toFixed(1) + 'px');
    }

    scrollFrame = null;
  }

  window.addEventListener('scroll', function () {
    if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updateScrollEffects);
  }, { passive: true });
  updateScrollEffects();

  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.video-card, .repertoire-card, .frame').forEach(function (card) {
      card.addEventListener('pointermove', function (event) {
        var bounds = card.getBoundingClientRect();
        var x = (event.clientX - bounds.left) / bounds.width - 0.5;
        var y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.setProperty('--tilt-x', (-y * 3).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', (x * 3).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  var slideshow = document.querySelector('[data-hero-slideshow]');
  if (!slideshow) return;

  var photos = [
    '2019-02-22_14-34-32_322.jpeg',
    '2021-07-24_08-26-18_000.jpeg',
    '2022-05-05_07-53-35_332.jpeg',
    '2023-03-26_19-02-16_000 (2023-04-01T04_13_30.273).jpeg',
    '2024-12-01_23-48-35_000 (2024-12-29T16_21_29.670).png',
    'CANON_Canon EOS 80D_57922496-58024897_000.JPG',
    'IMG_0054.JPG',
    'Sequence 01.Still003.bmp',
    'teachig moment.JPG'
  ];

  var slides = photos.map(function (photo, index) {
    var image = document.createElement('img');
    image.className = 'hero-slide' + (index === 0 ? ' is-active is-alternate' : '');
    image.src = 'images/' + encodeURIComponent(photo);
    image.alt = '';
    image.loading = index === 0 ? 'eager' : 'lazy';
    image.decoding = 'async';
    slideshow.appendChild(image);
    return image;
  });

  var controls = document.createElement('div');
  controls.className = 'hero-gallery-controls';
  controls.innerHTML = '<div class="hero-gallery-dots" aria-label="Choose photograph"></div>' +
    '<button class="hero-gallery-pause" type="button" aria-label="Pause slideshow" title="Pause slideshow">Ⅱ</button>';
  slideshow.parentElement.appendChild(controls);

  var dotsContainer = controls.querySelector('.hero-gallery-dots');
  var dots = slides.map(function (_, index) {
    var dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero-gallery-dot' + (index === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', 'Show photograph ' + (index + 1));
    dot.addEventListener('click', function () { show(index); });
    dotsContainer.appendChild(dot);
    return dot;
  });

  var current = 0;
  var timer = null;
  var paused = false;
  var pauseButton = controls.querySelector('.hero-gallery-pause');

  function show(index) {
    if (index === current && slides[index].classList.contains('is-active')) return;
    slides[current].classList.remove('is-active', 'is-alternate');
    dots[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.remove('is-alternate');
    if (current % 2 === 0) slides[current].classList.add('is-alternate');
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
    if (!paused) restart();
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(function () { show(current + 1); }, 6500);
  }

  pauseButton.addEventListener('click', function () {
    paused = !paused;
    clearInterval(timer);
    if (!paused) restart();
    pauseButton.textContent = paused ? '▶' : 'Ⅱ';
    pauseButton.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    pauseButton.title = paused ? 'Play slideshow' : 'Pause slideshow';
  });

  if (!reduceMotion) restart();
});
