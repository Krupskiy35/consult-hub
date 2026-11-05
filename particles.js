
/*
 * CONSULT HUB — HYBRID RING PARTICLES v9
 *
 * Маленькі блакитні кільця замість крапок.
 * Збирання напису, реакція на курсор,
 * плавне повернення та адаптивність.
 */

(() => {
    "use strict";

    const canvas = document.getElementById(
        "consult-particles-canvas"
    );

    const hero = canvas?.closest(".hero");

    if (!canvas || !hero) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const CONFIG = {
        text: "CONSULT HUB",

        // Колір Consult Hub — #39BAFA
        color: [57, 186, 250],

        // Зовнішній вигляд кілець
        opacity: 0.9,
        referenceFontSize: 180,
        referenceStretchY: 1.6,
        referenceSpacing: 5,

        // Радіус кільця та товщина контуру
        referenceRingRadius: 1.4,
        referenceRingWidth: 0.65,

        // Анімація збирання
        appearDuration: 2400,
        appearDelay: 500,
        particleDelay: 850,
        scatterRadius: 0.28,

        // Реакція на курсор
        hoverRadius: 135,
        hoverForce: 48,
        hoverEase: 0.13,
        returnEase: 0.055,

        // Мерехтіння
        pulseSpeed: 0.0013,
        pulseAmount: 0.08,

        // Продуктивність
        maxDpr: 2
    };

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const TAU = Math.PI * 2;

    let width = 0;
    let height = 0;
    let dpr = 1;

    let particles = [];
    let reference = null;

    let ringRadius = 1.4;
    let ringWidth = 0.65;

    let rafId = null;
    let startTime = null;
    let lastTime = null;

    let isVisible = true;
    let isReady = false;

    let resizeTimer = null;

    const pointer = {
        x: -10000,
        y: -10000,
        active: false
    };

    // =========================================
    // 01. ДОПОМІЖНІ ФУНКЦІЇ
    // =========================================

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function random(min, max) {
        return min + Math.random() * (max - min);
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    // =========================================
    // 02. СТВОРЕННЯ МАСКИ НАПИСУ
    // =========================================

    function createReferenceMask() {
        const fontSize = CONFIG.referenceFontSize;

        const measureCanvas =
            document.createElement("canvas");

        const measureCtx =
            measureCanvas.getContext("2d");

        if (!measureCtx) return null;

        measureCtx.font =
            `900 ${fontSize}px Intel, sans-serif`;

        const measuredWidth =
            measureCtx.measureText(CONFIG.text).width;

        const padding = 32;

        const maskWidth = Math.ceil(
            measuredWidth + padding * 2
        );

        const maskHeight = Math.ceil(
            fontSize *
            CONFIG.referenceStretchY *
            1.5
        );

        const mask = document.createElement("canvas");

        mask.width = maskWidth;
        mask.height = maskHeight;

        const mctx = mask.getContext("2d", {
            willReadFrequently: true
        });

        if (!mctx) return null;

        mctx.save();

        mctx.translate(
            maskWidth / 2,
            maskHeight / 2
        );

        mctx.scale(
            1,
            CONFIG.referenceStretchY
        );

        mctx.font =
            `900 ${fontSize}px Intel, sans-serif`;

        mctx.textAlign = "center";
        mctx.textBaseline = "middle";
        mctx.fillStyle = "#ffffff";

        mctx.fillText(CONFIG.text, 0, 0);

        mctx.restore();

        const imageData = mctx.getImageData(
            0,
            0,
            maskWidth,
            maskHeight
        ).data;

        const points = [];

        const spacing = CONFIG.referenceSpacing;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (
            let y = 0;
            y < maskHeight;
            y += spacing
        ) {
            for (
                let x = 0;
                x < maskWidth;
                x += spacing
            ) {
                const alpha = imageData[
                (y * maskWidth + x) * 4 + 3
                    ];

                if (alpha < 130) continue;

                points.push({ x, y });

                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }

        if (!points.length) return null;

        return {
            points,
            minX,
            maxX,
            minY,
            maxY,
            textWidth: maxX - minX + spacing,
            textHeight: maxY - minY + spacing
        };
    }

    // =========================================
    // 03. РОЗМІРИ CANVAS
    // =========================================

    function resizeCanvas() {
        const rect = hero.getBoundingClientRect();

        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);

        dpr = Math.min(
            window.devicePixelRatio || 1,
            CONFIG.maxDpr
        );

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(
            dpr, 0,
            0, dpr,
            0, 0
        );
    }

    // =========================================
    // 04. СТВОРЕННЯ ЧАСТИНОК
    // =========================================

    function buildParticles() {
        resizeCanvas();

        if (!reference) {
            reference = createReferenceMask();
        }

        if (!reference) {
            isReady = false;
            return;
        }

        const isMobile = width <= 760;

        const isTablet =
            width > 760 && width <= 1024;

        // Зберігаємо розташування напису
        const targetWidth = width * (
            isMobile ? 0.94 :
                isTablet ? 0.88 :
                    0.96
        );

        const maxTextHeight = height * (
            isMobile ? 0.16 :
                isTablet ? 0.20 :
                    0.35
        );

        const scale = Math.min(
            targetWidth / reference.textWidth,
            maxTextHeight / reference.textHeight
        );

        const centerX = width / 2;

        let centerY;

        if (isMobile) {
            centerY = height * 0.16;
        } else if (isTablet) {
            centerY = height * 0.22;
        } else {
            centerY = height * 0.35;
        }

        const halfTextHeight =
            reference.textHeight * scale / 2;

        centerY = Math.max(
            centerY,
            halfTextHeight + 12
        );

        // Розмір кілець адаптується до екрана
        ringRadius = clamp(
            CONFIG.referenceRingRadius * scale,
            0.8,
            1.4
        );

        ringWidth = clamp(
            CONFIG.referenceRingWidth * scale,
            0.45,
            0.65
        );

        const refCenterX =
            (reference.minX + reference.maxX) / 2;

        const refCenterY =
            (reference.minY + reference.maxY) / 2;

        const scatterDistance =
            Math.min(width, height) *
            CONFIG.scatterRadius;

        particles = reference.points.map(point => {
            const tx =
                centerX +
                (point.x - refCenterX) * scale;

            const ty =
                centerY +
                (point.y - refCenterY) * scale;

            const angle = random(0, TAU);

            const distance = random(
                scatterDistance * 0.3,
                scatterDistance
            );

            const startX =
                tx + Math.cos(angle) * distance;

            const startY =
                ty + Math.sin(angle) * distance;

            return {
                tx,
                ty,

                x: startX,
                y: startY,

                vx: 0,
                vy: 0,

                startX,
                startY,

                delay: random(
                    0,
                    CONFIG.particleDelay
                ),

                phase: random(0, TAU),

                opacityFactor: random(0.75, 1),
                sizeFactor: random(0.85, 1.15),

                reaction: 0
            };
        });

        startTime = null;
        lastTime = null;

        isReady = true;
    }

    // =========================================
    // 05. МАЛЮВАННЯ МАЛЕНЬКИХ КІЛЕЦЬ
    // =========================================

    function drawRing(x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.stroke();
    }

    // =========================================
    // 06. ОСНОВНА АНІМАЦІЯ
    // =========================================

    function draw(time) {
        rafId = null;

        if (!isVisible || !isReady) return;

        if (startTime === null) {
            startTime = time;
        }

        const dt = lastTime === null
            ? 1
            : clamp(
                (time - lastTime) / 16.667,
                0.1,
                2
            );

        lastTime = time;

        const elapsed = time - startTime;

        const staticMode = reducedMotion.matches;

        ctx.clearRect(
            0,
            0,
            width,
            height
        );

        // Градієнт CONSULT HUB
// Зліва блакитний, справа білий

        const gradientStart = [255, 255, 255]; // Білий зліва
        const gradientEnd = [35, 205, 255];    // Яскравий блакитний справа

        const gradientLeft = Math.min(
            ...particles.map(p => p.tx)
        );

        const gradientRight = Math.max(
            ...particles.map(p => p.tx)
        );

        const hoverRadius =
            CONFIG.hoverRadius *
            clamp(width / 1440, 0.55, 1);

        const hoverForce =
            CONFIG.hoverForce *
            clamp(width / 1440, 0.45, 1);

        for (const p of particles) {

            // Поява частинок
            const progress = staticMode
                ? 1
                : clamp(
                    (
                        elapsed -
                        CONFIG.appearDelay -
                        p.delay
                    ) / CONFIG.appearDuration,
                    0,
                    1
                );

            if (progress <= 0) continue;

            const ease = easeOutCubic(progress);
            const assembling = progress < 1;

            let targetX = p.tx;
            let targetY = p.ty;

            // Збирання напису
            if (assembling) {
                targetX =
                    p.startX +
                    (p.tx - p.startX) * ease;

                targetY =
                    p.startY +
                    (p.ty - p.startY) * ease;
            }

            // Реакція на курсор
            let influence = 0;

            if (
                pointer.active &&
                !staticMode &&
                !assembling
            ) {
                const dx = p.x - pointer.x;
                const dy = p.y - pointer.y;

                const distance = Math.hypot(
                    dx,
                    dy
                );

                if (distance < hoverRadius) {
                    const t =
                        1 - distance / hoverRadius;

                    influence = t * t;

                    const safeDistance =
                        Math.max(distance, 1);

                    p.vx +=
                        (dx / safeDistance) *
                        hoverForce *
                        influence *
                        0.09 *
                        dt;

                    p.vy +=
                        (dy / safeDistance) *
                        hoverForce *
                        influence *
                        0.09 *
                        dt;
                }
            }

            const reactionEase =
                influence > p.reaction
                    ? CONFIG.hoverEase
                    : CONFIG.returnEase;

            p.reaction += (
                influence - p.reaction
            ) * (
                1 - Math.pow(
                    1 - reactionEase,
                    dt
                )
            );

            if (staticMode) {
                p.x = p.tx;
                p.y = p.ty;
                p.vx = 0;
                p.vy = 0;

            } else if (assembling) {
                p.x += (
                    targetX - p.x
                ) * (
                    1 - Math.pow(0.78, dt)
                );

                p.y += (
                    targetY - p.y
                ) * (
                    1 - Math.pow(0.78, dt)
                );

            } else {
                // Пружне повернення частинок
                const spring = 0.035;

                const friction = Math.pow(
                    0.88,
                    dt
                );

                p.vx += (
                    targetX - p.x
                ) * spring * dt;

                p.vy += (
                    targetY - p.y
                ) * spring * dt;

                p.vx *= friction;
                p.vy *= friction;

                p.x += p.vx * dt;
                p.y += p.vy * dt;
            }

            // Легке мерехтіння
            const pulse = staticMode
                ? 1
                : 1 +
                Math.sin(
                    time * CONFIG.pulseSpeed +
                    p.phase
                ) * CONFIG.pulseAmount;

            const alpha = clamp(
                CONFIG.opacity *
                p.opacityFactor *
                pulse *
                ease,
                0,
                1
            );

            // Блакитний контур кільця

            const t = clamp(
                (p.tx - gradientLeft) /
                Math.max(1, gradientRight - gradientLeft),
                0,
                1
            );

            const r = Math.round(
                gradientStart[0] +
                (gradientEnd[0] - gradientStart[0]) * t
            );

            const g = Math.round(
                gradientStart[1] +
                (gradientEnd[1] - gradientStart[1]) * t
            );

            const b = Math.round(
                gradientStart[2] +
                (gradientEnd[2] - gradientStart[2]) * t
            );

            const brighterAlpha = Math.min(1, alpha * 1.5);

            ctx.strokeStyle =
                `rgba(${r},${g},${b},${brighterAlpha})`;


            ctx.lineWidth = ringWidth;

            const radius =
                ringRadius *
                p.sizeFactor *
                (1 + p.reaction * 0.12);

            drawRing(
                p.x,
                p.y,
                radius
            );
        }

        if (!staticMode) {
            rafId = requestAnimationFrame(draw);
        }
    }

    // =========================================
    // 07. ЗАПУСК І ЗУПИНКА
    // =========================================

    function stop() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        lastTime = null;
    }

    function start() {
        if (
            !isVisible ||
            !isReady ||
            rafId !== null
        ) {
            return;
        }

        rafId = requestAnimationFrame(draw);
    }

    // =========================================
    // 08. РЕАКЦІЯ НА КУРСОР
    // =========================================

    hero.addEventListener(
        "pointermove",
        event => {
            if (event.pointerType !== "mouse") {
                return;
            }

            const rect =
                hero.getBoundingClientRect();

            pointer.x =
                event.clientX - rect.left;

            pointer.y =
                event.clientY - rect.top;

            pointer.active = true;
        }
    );

    hero.addEventListener(
        "pointerleave",
        () => {
            pointer.active = false;
        }
    );

    window.addEventListener(
        "blur",
        () => {
            pointer.active = false;
        }
    );

    // =========================================
    // 09. ВИДИМІСТЬ HERO
    // =========================================

    if ("IntersectionObserver" in window) {
        const observer =
            new IntersectionObserver(
                entries => {
                    isVisible =
                        entries[0].isIntersecting;

                    if (isVisible) {
                        start();
                    } else {
                        stop();
                    }
                },
                {
                    threshold: 0.01
                }
            );

        observer.observe(hero);
    }

    // =========================================
    // 10. АДАПТИВНІСТЬ
    // =========================================

    window.addEventListener(
        "resize",
        () => {
            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(
                () => {
                    stop();
                    buildParticles();
                    start();
                },
                150
            );
        }
    );

    // =========================================
    // 11. REDUCED MOTION
    // =========================================

    function onMotionChange() {
        stop();
        start();
    }

    if (reducedMotion.addEventListener) {
        reducedMotion.addEventListener(
            "change",
            onMotionChange
        );
    } else if (reducedMotion.addListener) {
        reducedMotion.addListener(
            onMotionChange
        );
    }

    // =========================================
    // 12. ІНІЦІАЛІЗАЦІЯ
    // =========================================

    async function init() {
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        buildParticles();
        start();
    }

    init();

})();
