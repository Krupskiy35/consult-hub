
/* CONSULT HUB — RESPONSIVE PARTICLES  */

(() => {
    "use strict";

    const canvas = document.getElementById(
        "consult-particles-canvas"
    );

    const hero = canvas?.closest(".hero");

    if (!canvas || !hero) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const config = {
        text: "CONSULT HUB",
        color: [85, 195, 255],
        opacity: 0.98,

        // Еталонний вигляд літер
        referenceFontSize: 180,
        referenceStretchY: 1.6,

        // Щільніша сітка та дрібніші хрестики
        referenceSpacing: 5,
        referenceCrossSize: 1.45,

        hoverRadius: 130,
        hoverForce: 22,
        appearDuration: 1600
    };

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    let width = 0;
    let height = 0;
    let dpr = 1;

    let particles = [];
    let startTime = null;
    let animationId = null;
    let visible = true;

    let crossSize = config.referenceCrossSize;
    let lineWidth = 0.8;
    let digitSize = 9;

    const pointer = {
        x: -10000,
        y: -10000,
        active: false
    };

    // Допоміжна функція
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    // Створюємо одну еталонну маску напису
    function createReferenceMask() {
        const fontSize = config.referenceFontSize;

        const measureCanvas = document.createElement("canvas");
        const measureCtx = measureCanvas.getContext("2d");

        if (!measureCtx) return null;

        measureCtx.font =
            `900 ${fontSize}px Arial, sans-serif`;

        const measuredWidth = measureCtx.measureText(
            config.text
        ).width;

        const padding = 24;

        const maskWidth = Math.ceil(
            measuredWidth + padding * 2
        );

        const maskHeight = Math.ceil(
            fontSize * config.referenceStretchY * 1.5
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
            config.referenceStretchY
        );

        mctx.font =
            `900 ${fontSize}px Arial, sans-serif`;

        mctx.textAlign = "center";
        mctx.textBaseline = "middle";
        mctx.fillStyle = "#ffffff";

        mctx.fillText(config.text, 0, 0);

        mctx.restore();

        const imageData = mctx.getImageData(
            0,
            0,
            maskWidth,
            maskHeight
        );

        const points = [];
        const spacing = config.referenceSpacing;

        let minX = maskWidth;
        let maxX = 0;
        let minY = maskHeight;
        let maxY = 0;

        // Зчитуємо частинки з еталонної маски
        for (let y = 0; y < maskHeight; y += spacing) {
            for (let x = 0; x < maskWidth; x += spacing) {

                const alpha = imageData.data[
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

    let reference = null;

    function buildParticles() {
        const rect = hero.getBoundingClientRect();

        width = Math.max(1, Math.round(rect.width));
        height = Math.max(1, Math.round(rect.height));

        dpr = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (!reference) {
            reference = createReferenceMask();
        }

        if (!reference) return;

        // Адаптивні діапазони
        const isMobile = width <= 760;
        const isTablet = width > 760 && width <= 1024;

        /*
         * АДАПТИВНА ШИРИНА НАПИСУ
         *
         * Mobile: 94%
         * Tablet: 88%
         * Desktop: 96%
         */
        const targetWidth = width * (
            isMobile ? 0.94 :
                isTablet ? 0.88 :
                    0.96
        );

        /*
         * АДАПТИВНА ВИСОТА НАПИСУ
         *
         * Mobile: 16% висоти Hero
         * Tablet: 20% висоти Hero
         * Desktop: 35% висоти Hero
         */
        const maxTextHeight = height * (
            isMobile ? 0.16 :
                isTablet ? 0.20 :
                    0.35
        );

        // Єдиний пропорційний масштаб
        const scale = Math.min(
            targetWidth / reference.textWidth,
            maxTextHeight / reference.textHeight
        );

        // Центрування по горизонталі
        const centerX = width / 2;

        /*
         * ВЕРТИКАЛЬНЕ РОЗТАШУВАННЯ
         *
         * Mobile: 16%
         * Tablet: 22%
         * Desktop: 35%
         */
        let centerY;

        if (isMobile) {
            centerY = height * 0.16;
        } else if (isTablet) {
            centerY = height * 0.22;
        } else {
            centerY = height * 0.35;
        }

        // Захист від обрізання зверху
        const halfTextHeight =
            reference.textHeight * scale / 2;

        centerY = Math.max(
            centerY,
            halfTextHeight + 12
        );

        // Дрібніші хрестики з адаптивним масштабом
        crossSize = clamp(
            config.referenceCrossSize * scale,
            0.55,
            1.45
        );

        // Тонші лінії для щільнішої сітки
        lineWidth = clamp(
            0.8 * scale,
            0.45,
            0.8
        );

        digitSize = clamp(
            9 * scale,
            5,
            9
        );

        // Переносимо еталонні координати на екран
        const referenceCenterX =
            (reference.minX + reference.maxX) / 2;

        const referenceCenterY =
            (reference.minY + reference.maxY) / 2;

        particles = reference.points.map(point => {

            const x = centerX +
                (point.x - referenceCenterX) * scale;

            const y = centerY +
                (point.y - referenceCenterY) * scale;

            return {
                x,
                y,

                offsetX:
                    (Math.random() - 0.5) * 38 * scale,

                offsetY:
                    (Math.random() - 0.5) * 38 * scale,

                phase: Math.random() * Math.PI * 2,

                delay: Math.random() * 900,

                digit: Math.random() > 0.5 ? "1" : "0",

                reaction: 0
            };
        });

        startTime = null;
    }

    // Малюємо хрестик
    function drawCross(x, y, size) {
        ctx.beginPath();

        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);

        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);

        ctx.stroke();
    }

    function draw(time) {
        animationId = null;

        if (!visible) return;

        if (startTime === null) {
            startTime = time;
        }

        ctx.clearRect(0, 0, width, height);

        const elapsed = time - startTime;
        const staticMode = reducedMotion.matches;

        const colorBase = config.color.join(",");

        ctx.lineWidth = lineWidth;

        for (const p of particles) {

            const progress = staticMode
                ? 1
                : clamp(
                    (elapsed - p.delay) /
                    config.appearDuration,
                    0,
                    1
                );

            if (progress <= 0) continue;

            const ease =
                1 - Math.pow(1 - progress, 3);

            const distance = pointer.active
                ? Math.hypot(
                    pointer.x - p.x,
                    pointer.y - p.y
                )
                : Infinity;

            const influence = staticMode
                ? 0
                : Math.max(
                    0,
                    1 - distance / config.hoverRadius
                );

            p.reaction += (
                influence - p.reaction
            ) * 0.09;

            const angle = Math.atan2(
                p.y - pointer.y,
                p.x - pointer.x
            );

            const displacement =
                p.reaction *
                config.hoverForce *
                clamp(width / 1440, 0.4, 1);

            const x =
                p.x +
                p.offsetX * (1 - ease) +
                Math.cos(angle) * displacement;

            const y =
                p.y +
                p.offsetY * (1 - ease) +
                Math.sin(angle) * displacement;

            const pulse = staticMode
                ? 1
                : 0.94 +
                Math.sin(
                    time * 0.001 + p.phase
                ) * 0.06;

            const alpha =
                config.opacity * ease * pulse;

            const color =
                `rgba(${colorBase},${alpha})`;

            ctx.strokeStyle = color;
            ctx.fillStyle = color;

            if (p.reaction > 0.48) {

                ctx.font = `${digitSize}px monospace`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                ctx.fillText(p.digit, x, y);

            } else {

                drawCross(
                    x,
                    y,
                    crossSize
                );
            }
        }

        if (!staticMode) {
            animationId = requestAnimationFrame(draw);
        }
    }

    function start() {
        if (animationId === null && visible) {
            animationId = requestAnimationFrame(draw);
        }
    }

    // Реакція на курсор
    hero.addEventListener("pointermove", event => {

        const rect = hero.getBoundingClientRect();

        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
        pointer.active = true;
    });

    hero.addEventListener("pointerleave", () => {
        pointer.active = false;
    });

    // Зупинка анімації поза екраном
    const observer = new IntersectionObserver(entries => {

        visible = entries[0].isIntersecting;

        if (!visible && animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (visible) {
            start();
        }
    });

    observer.observe(hero);

    // Адаптивність
    let resizeTimeout;

    window.addEventListener("resize", () => {

        clearTimeout(resizeTimeout);

        resizeTimeout = setTimeout(() => {

            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }

            buildParticles();
            start();

        }, 150);
    });

    // Підтримка reduced motion
    reducedMotion.addEventListener?.("change", () => {

        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        start();
    });

    // Запуск після завантаження шрифту
    async function init() {
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        buildParticles();
        start();
    }

    init();

})();
