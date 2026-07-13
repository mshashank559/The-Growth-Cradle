/* ==========================================================================
   THE GROWTH CRADLE — LUXURY MOTION SYSTEM & INTERACTION ENGINE
   Performance-optimised version: single rAF loop, passive listeners,
   batched ScrollTrigger, no mix-blend-mode, GPU-accelerated transforms.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // Ensure GSAP and ScrollTrigger are loaded
    gsap.registerPlugin(ScrollTrigger);

    /* ==========================================================================
       1. SMOOTH INERTIA SCROLL (LENIS) — properly wired to GSAP ticker
       ========================================================================== */
    let lenis;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.0,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
            smoothTouch: false,
        });

        // Wire Lenis to GSAP ticker — single rAF, no duplicate loops
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);

        // Connect ScrollTrigger to Lenis
        lenis.on('scroll', ScrollTrigger.update);
    }


    /* ==========================================================================
       2. CUSTOM MOUSE FOLLOWER — GPU-accelerated via transform
       ========================================================================== */
    const cursor = document.getElementById('custom-cursor');
    const cursorDot = document.getElementById('cursor-dot');
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let dotX = 0, dotY = 0;
    let rafCursorId;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Single rAF loop — use transform instead of left/top (avoids layout)
    function renderCursor() {
        cursorX += (mouseX - cursorX) * 0.1;
        cursorY += (mouseY - cursorY) * 0.1;
        dotX   += (mouseX - dotX)    * 0.28;
        dotY   += (mouseY - dotY)    * 0.28;

        if (cursor) cursor.style.transform = `translate(${cursorX - 12}px, ${cursorY - 12}px)`;
        if (cursorDot) cursorDot.style.transform = `translate(${dotX - 2.5}px, ${dotY - 2.5}px)`;

        rafCursorId = requestAnimationFrame(renderCursor);
    }
    renderCursor();

    // Hover expansions — throttled via CSS transitions
    const hoverTargets = document.querySelectorAll('.hover-target');
    hoverTargets.forEach(target => {
        target.addEventListener('mouseenter', () => {
            if (cursor) cursor.classList.add('hovering');
        });
        target.addEventListener('mouseleave', () => {
            if (cursor) cursor.classList.remove('hovering');
        });
    });


    /* ==========================================================================
       3. PRELOADER ENGINE
       ========================================================================== */
    const preloader = document.getElementById('preloader');
    const progress  = document.getElementById('preloader-progress');
    let width = 0;

    const loadInterval = setInterval(() => {
        if (width >= 100) {
            clearInterval(loadInterval);
            finishLoading();
        } else {
            width += Math.floor(Math.random() * 15) + 5;
            if (width > 100) width = 100;
            if (progress) progress.style.width = `${width}%`;
        }
    }, 70);

    function finishLoading() {
        gsap.to(preloader, {
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            onComplete: () => {
                preloader.style.display = 'none';
                triggerHeroEntrance();
            }
        });
    }

    window.addEventListener('load', () => {
        clearInterval(loadInterval);
        if (progress) progress.style.width = '100%';
        finishLoading();
    });


    /* ==========================================================================
       4. HERO PAGE ENTRANCE
       ========================================================================== */
    function triggerHeroEntrance() {
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

        tl.fromTo('#navbar',
            { y: -60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9 }
        )
        .fromTo('.hero-label-wrapper',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.7 }, '-=0.5'
        )
        .fromTo('.reveal-line',
            { yPercent: 110, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 1.2, stagger: 0.1 }, '-=0.4'
        )
        .fromTo('.hero-subhead',
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9 }, '-=0.6'
        )
        .fromTo('.hero-actions',
            { y: 25, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8 }, '-=0.6'
        )
        .fromTo('.hero-trust-bar',
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8 }, '-=0.5'
        )
        .fromTo('.hero-scroll-badge-wrapper',
            { opacity: 0 },
            { opacity: 1, duration: 0.6 }, '-=0.3'
        );
    }


    /* ==========================================================================
       5. STICKY NAVBAR — single consolidated scroll handler
       ========================================================================== */
    const navbar          = document.getElementById('navbar');
    const scrollProgressBar = document.getElementById('scroll-progress-bar');
    const heroSection     = document.getElementById('hero');
    const floatingCta     = document.getElementById('floating-cta');
    const isVideoBgHero   = heroSection && heroSection.classList.contains('has-video-bg');

    let lastScrollTop = 0;
    let ticking = false; // rAF-throttle the scroll handler

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }

    function handleScroll() {
        const scrollTop   = window.scrollY;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

        // --- scroll progress bar ---
        if (totalHeight > 0 && scrollProgressBar) {
            scrollProgressBar.style.transform = `scaleX(${scrollTop / totalHeight})`;
        }

        // --- glass blur on navbar ---
        navbar.classList.toggle('scrolled', scrollTop > 60);

        // --- hero dark mode: transparent navbar over dark video hero ---
        if (isVideoBgHero) {
            const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
            const onHero     = scrollTop < heroBottom - 100;
            navbar.classList.toggle('navbar-dark', onHero);
            navbar.classList.toggle('hero-is-dark', onHero);

            const lightLogo = navbar.querySelector('.logo-for-light');
            const darkLogo  = navbar.querySelector('.logo-for-dark');
            if (lightLogo) lightLogo.style.display = onHero ? 'none' : '';
            if (darkLogo)  darkLogo.style.display  = onHero ? 'block' : '';
        } else {
            // detect other dark sections
            const darkSections = document.querySelectorAll('.dark-section');
            let isOverDark = false;
            darkSections.forEach(sec => {
                const r = sec.getBoundingClientRect();
                if (r.top <= 80 && r.bottom >= 80) isOverDark = true;
            });
            navbar.classList.toggle('navbar-dark', isOverDark);
        }

        // --- hide/show navbar on scroll direction ---
        if (scrollTop > 200) {
            gsap.to(navbar, {
                y: scrollTop > lastScrollTop ? -100 : 0,
                duration: 0.35,
                ease: 'power2.out',
                overwrite: 'auto'
            });
        } else {
            gsap.to(navbar, { y: 0, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
        }

        // --- floating CTA ---
        if (floatingCta) {
            const heroH = heroSection?.offsetHeight || 600;
            floatingCta.classList.toggle('visible', scrollTop > heroH * 0.8);
        }

        lastScrollTop = Math.max(0, scrollTop);
        updateActiveLink();
        ticking = false;
    }

    // Passive listener — browser can optimise scroll painting
    window.addEventListener('scroll', onScroll, { passive: true });


    /* ==========================================================================
       6. ACTIVE NAVIGATION LINK HIGHLIGHTING
       ========================================================================== */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveLink() {
        const scrollPos = window.scrollY + 160;
        let current = '';
        sections.forEach(sec => {
            if (scrollPos >= sec.offsetTop) current = sec.id;
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    }

    // Mobile menu toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu   = document.getElementById('nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('open');
            navMenu.classList.toggle('open');
        });
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('open');
                navMenu.classList.remove('open');
            });
        });
    }

    // Smooth anchor scroll via Lenis
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (!target) return;
            e.preventDefault();
            if (lenis) {
                lenis.scrollTo(target, { offset: -80, duration: 1.2 });
            } else {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });


    /* ==========================================================================
       7. SCROLL TRIGGER REVEALS — BATCHED for performance
       ========================================================================== */

    // Batch all card-like elements together → one IntersectionObserver internally
    ScrollTrigger.batch('.glass-panel', {
        onEnter: batch => gsap.fromTo(batch,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: 'auto' }
        ),
        start: 'top 88%',
        once: true
    });

    ScrollTrigger.batch('.timeline-step', {
        onEnter: batch => gsap.fromTo(batch,
            { x: -30, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1, overwrite: 'auto' }
        ),
        start: 'top 88%',
        once: true
    });

    ScrollTrigger.batch('.industry-badge', {
        onEnter: batch => gsap.fromTo(batch,
            { scale: 0.85, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.4)', stagger: 0.05, overwrite: 'auto' }
        ),
        start: 'top 90%',
        once: true
    });

    // Section headlines
    document.querySelectorAll('.section-title, .section-label').forEach(el => {
        gsap.fromTo(el,
            { y: 25, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 90%', once: true }
            }
        );
    });


    /* ==========================================================================
       8. STATS COUNTER TRIGGER
       ========================================================================== */
    document.querySelectorAll('.stat-number[data-target]').forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'), 10);
        const obj = { val: 0 };
        ScrollTrigger.create({
            trigger: stat,
            start: 'top 85%',
            once: true,
            onEnter: () => gsap.to(obj, {
                val: target,
                duration: 2,
                ease: 'power2.out',
                onUpdate: () => { stat.textContent = Math.round(obj.val); }
            })
        });
    });


    /* ==========================================================================
       9. TIMELINE METHODOLOGY PROGRESS — passive, rAF-throttled
       ========================================================================== */
    const timelineProgress = document.getElementById('timeline-progress');
    const timelineSteps    = document.querySelectorAll('.timeline-step');

    if (timelineProgress && timelineSteps.length) {
        // Use ScrollTrigger scrub instead of a raw scroll listener
        const firstStep = timelineSteps[0];
        const lastStep  = timelineSteps[timelineSteps.length - 1];

        gsap.to(timelineProgress, {
            height: '100%',
            ease: 'none',
            scrollTrigger: {
                trigger: firstStep,
                endTrigger: lastStep,
                start: 'top 60%',
                end: 'bottom 60%',
                scrub: 0.5
            }
        });

        timelineSteps.forEach(step => {
            ScrollTrigger.create({
                trigger: step,
                start: 'top 62%',
                onEnter: () => step.classList.add('active'),
                onLeaveBack: () => step.classList.remove('active')
            });
        });
    }


    /* ==========================================================================
       10. MAGNETIC BUTTON PHYSICS
       ========================================================================== */
    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const r = btn.getBoundingClientRect();
            const x = (e.clientX - r.left - r.width  / 2) * 0.3;
            const y = (e.clientY - r.top  - r.height / 2) * 0.3;
            gsap.to(btn, { x, y, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
        });
    });


    /* ==========================================================================
       11. 3D TILT EFFECT — only on desktop, uses will-change
       ========================================================================== */
    if (window.matchMedia('(min-width: 992px)').matches) {
        document.querySelectorAll('.case-card, .compare-card').forEach(card => {
            card.style.willChange = 'transform';
            card.addEventListener('mousemove', (e) => {
                const r  = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width;
                const py = (e.clientY - r.top)  / r.height;
                gsap.to(card, {
                    rotateX: (0.5 - py) * 10,
                    rotateY: (px - 0.5) * 10,
                    transformPerspective: 900,
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
            });
        });
    }


    /* ==========================================================================
       12. TESTIMONIAL SLIDER
       ========================================================================== */
    const testimonialTrack = document.getElementById('testimonial-track');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    let currentSlide = 0;
    const totalSlides = 3;

    if (testimonialTrack && prevBtn && nextBtn) {
        function updateCarousel() {
            gsap.to(testimonialTrack, {
                xPercent: -currentSlide * 33.3333,
                duration: 0.75,
                ease: 'power3.out',
                overwrite: 'auto'
            });
        }
        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
        });
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
        });
    }


    /* ==========================================================================
       13. FAQ ACCORDION
       ========================================================================== */
    document.querySelectorAll('.faq-item').forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const panel   = item.querySelector('.faq-panel');
        const icon    = item.querySelector('.faq-icon-box i');

        trigger.addEventListener('click', () => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

            // Close all others
            document.querySelectorAll('.faq-item').forEach(other => {
                if (other !== item) {
                    other.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
                    other.querySelector('.faq-panel').style.maxHeight = '0';
                    const otherIcon = other.querySelector('.faq-icon-box i');
                    if (otherIcon) otherIcon.className = 'ri-add-line';
                }
            });

            if (isExpanded) {
                trigger.setAttribute('aria-expanded', 'false');
                panel.style.maxHeight = '0';
                if (icon) icon.className = 'ri-add-line';
            } else {
                trigger.setAttribute('aria-expanded', 'true');
                panel.style.maxHeight = `${panel.scrollHeight}px`;
                if (icon) icon.className = 'ri-subtract-line';
            }
        });
    });


    /* ==========================================================================
       14. CONTACT FORM
       ========================================================================== */
    const contactForm  = document.getElementById('agency-contact-form');
    const formFeedback = document.getElementById('form-feedback');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const btnText   = submitBtn?.querySelector('span');
            const name      = document.getElementById('name')?.value;
            const email     = document.getElementById('email')?.value;

            if (formFeedback) {
                formFeedback.textContent = 'Sending your request…';
                formFeedback.className   = 'form-feedback success';
            }
            if (submitBtn) submitBtn.disabled = true;
            if (btnText)   btnText.textContent = 'Sending…';

            setTimeout(() => {
                if (formFeedback) {
                    formFeedback.textContent = `Thank you, ${name}! We'll be in touch at ${email} to confirm your Discovery Call.`;
                }
                contactForm.reset();
                if (submitBtn) submitBtn.disabled = false;
                if (btnText)   btnText.textContent = 'Book Discovery Call';
                setTimeout(() => { if (formFeedback) formFeedback.textContent = ''; }, 8000);
            }, 1500);
        });
    }


    /* ==========================================================================
       15. INITIAL NAVBAR STATE (dark hero)
       ========================================================================== */
    if (isVideoBgHero) {
        navbar.classList.add('navbar-dark', 'hero-is-dark');
        const lightLogo = navbar.querySelector('.logo-for-light');
        const darkLogo  = navbar.querySelector('.logo-for-dark');
        if (lightLogo) lightLogo.style.display = 'none';
        if (darkLogo)  darkLogo.style.display  = 'block';
    }

});
