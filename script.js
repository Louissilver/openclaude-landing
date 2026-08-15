// OpenClaude Landing Page - Interatividade

(function() {
    'use strict';

    // Estado da aplicação
    const state = {
        isScrolled: false,
        isMobileMenuOpen: false,
        animationObserver: null
    };

    // Elementos DOM (lazy-init)
    const cache = {
        get navbar() { return document.querySelector('.navbar'); },
        get heroStats() { return document.querySelectorAll('.stat-number'); },
        get featureCards() { return document.querySelectorAll('.feature-card'); },
        get steps() { return document.querySelectorAll('.step'); },
        get codeBlock() { return document.querySelector('.code-block'); },
        get ctaSection() { return document.querySelector('.cta'); },
        get mobileToggle() { return document.querySelector('.mobile-menu-toggle'); }
    };

    // Utility: easings
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // Utility: throttle
    function throttle(fn, wait) {
        let last = 0;
        return function(...args) {
            const now = Date.now();
            if (now - last >= wait) {
                last = now;
                fn.apply(this, args);
            }
        };
    }

    // Navbar scroll + highlight
    function setupScrollListener() {
        const navbar = cache.navbar;
        if (!navbar) return;

        const onScroll = throttle(() => {
            state.isScrolled = window.scrollY > 50;
            navbar.classList.toggle('scrolled', state.isScrolled);
        }, 16);

        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // IntersectionObserver para animações de entrada
    function setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.feature-card, .step, .code-block, .cta').forEach(el => {
            observer.observe(el);
        });

        // Staggered delays
        document.querySelectorAll('.feature-card').forEach((card, i) => {
            card.style.transitionDelay = `${i * 100}ms`;
        });
        document.querySelectorAll('.step').forEach((step, i) => {
            step.style.transitionDelay = `${i * 150}ms`;
        });

        state.animationObserver = observer;
    }

    // Smooth scroll para links internos
    function setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (!targetId || targetId === '#') return;

                const target = document.querySelector(targetId);
                const navbar = cache.navbar;
                if (target && navbar) {
                    e.preventDefault();
                    const offsetTop = target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight - 10;
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    history.pushState(null, '', targetId);
                }
            });
        });
    }

    // Contadores animados
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number[data-target]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    animateCounterValue(counter);
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(c => observer.observe(c));

        function animateCounterValue(counter) {
            const target = parseFloat(counter.dataset.target);
            const suffix = counter.dataset.suffix || '';
            const duration = 2000;
            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutCubic(progress);

                if (target === 9999) {
                    // Special case: Infinity symbol
                    counter.textContent = '∞';
                } else if (target >= 1000) {
                    counter.textContent = `${Math.floor(target * eased / 1000)}${suffix}`;
                } else {
                    counter.textContent = `${Math.floor(target * eased)}${suffix}`;
                }

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    counter.textContent = `${target >= 1000 ? '' : ''}${Math.floor(target)}${suffix}`;
                    if (target === 9999) counter.textContent = '∞';
                    if (target === 0) counter.textContent = `0${suffix}`;
                }
            }

            requestAnimationFrame(update);
        }
    }

    // Menu mobile
    function setupMobileMenu() {
        const toggle = cache.mobileToggle;
        const navbar = cache.navbar;
        if (!toggle || !navbar) return;

        toggle.addEventListener('click', () => {
            state.isMobileMenuOpen = !state.isMobileMenuOpen;
            navbar.classList.toggle('nav-open', state.isMobileMenuOpen);
            toggle.setAttribute('aria-expanded', state.isMobileMenuOpen);
        });

        // Fechar ao clicar em link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                state.isMobileMenuOpen = false;
                navbar.classList.remove('nav-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (state.isMobileMenuOpen && !navbar.contains(e.target)) {
                state.isMobileMenuOpen = false;
                navbar.classList.remove('nav-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Copy to clipboard (handles both .copy-code-btn and .copy-code-btn-small)
    function setupCodeCopy() {
        const buttons = document.querySelectorAll('.copy-code-btn, .copy-code-btn-small');

        buttons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const codeBlock = btn.closest('.code-block, .code-block-small');
                const codeEl = codeBlock.querySelector('code');
                if (!codeEl) return;
                const code = codeEl.textContent.trim();

                try {
                    await navigator.clipboard.writeText(code);
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Copiado!
                    `;
                    btn.classList.add('copied');

                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('Falha ao copiar:', err);
                    btn.textContent = 'Erro';
                    setTimeout(() => {
                        btn.innerHTML = btn.dataset.original || originalHTML;
                    }, 2000);
                }
            });
        });
    }

    // Tabs interativas no tutorial
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');

                // Remove active de todos
                tabButtons.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));

                // Ativa o selecionado
                btn.classList.add('active');
                const targetPane = document.getElementById(tabId);
                if (targetPane) targetPane.classList.add('active');
            });
        });
    }

    // Theme (light/dark mode)
    function setupThemeToggle() {
        const stored = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (stored) {
            document.documentElement.setAttribute('data-theme', stored);
        } else if (!prefersDark) {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    // Error boundary
    function setupErrorBoundary() {
        window.addEventListener('error', (e) => {
            console.error('[OpenClaude Landing] Erro capturado:', e.message, e.filename, e.lineno);
        });
        window.addEventListener('unhandledrejection', (e) => {
            console.error('[OpenClaude Landing] Promise rejeitada:', e.reason);
            e.preventDefault();
        });
    }

    // Reveal elementos no scroll
    function setupRevealAnimation() {
        if (state.animationObserver) return;
        setupIntersectionObserver();
    }

    // Navegação por teclado
    function setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Tab tracking para focus visibility
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
            // Escape: fechar mobile menu
            if (e.key === 'Escape' && state.isMobileMenuOpen) {
                const navbar = cache.navbar;
                navbar.classList.remove('nav-open');
                state.isMobileMenuOpen = false;
                cache.mobileToggle?.setAttribute('aria-expanded', 'false');
            }
        });
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });
    }

    // Inicialização principal
    function init() {
        setupScrollListener();
        setupIntersectionObserver();
        setupSmoothScroll();
        setupMobileMenu();
        setupKeyboardNavigation();
        animateCounters();
        setupThemeToggle();
        setupErrorBoundary();
        setupRevealAnimation();

        document.body.classList.add('loaded');
    }

    // Carregar funcionalidades extras após load completo
    window.addEventListener('load', () => {
        setupCodeCopy();
        setupTabs();
    });

    // DOM pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expor para debugging em dev
    window.OpenClaudeLanding = {
        state,
        init,
        animateCounters
    };
})();