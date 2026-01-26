window.addEventListener("DOMContentLoaded", () => {
  const bg = document.querySelector(".bg");
  const slides = Array.from(document.querySelectorAll(".slide[data-bg]"));
  const allSlides = Array.from(document.querySelectorAll(".slide"));
  const startButton = document.querySelector("#startButton");
  const slide1 = document.querySelector(".slide1");
  const slide2 = document.querySelector(".slide2");
  const slide12 = document.querySelector(".slide12");
  const phoneOverlay = document.querySelector(".phoneOverlay");
  const phone = document.querySelector('.slide2Phone');
  const phoneSlides = Array.from(
    document.querySelectorAll(
      ".slide2, .slide3, .slide4, .slide5, .slide6, .slide7"
    )
  );
  const overlaySlides = Array.from(
    document.querySelectorAll(
      ".slide2, .slide3, .slide4, .slide5, .slide6, .slide7, .slide8, .slide9, .slide10, .slide11"
    )
  );
  const darkCircleSlides = Array.from(
    document.querySelectorAll(".slide8, .slide9, .slide10, .slide11")
  );
  const textSlides = Array.from(
    document.querySelectorAll(
      ".slide2, .slide3, .slide4, .slide5, .slide6, .slide7, .slide8, .slide9, .slide10, .slide11, .slide15, .slide16, .slide17, .slide18"
    )
  );
  const bottomTextSelector =
    ".slide6BottomText, .slide8BottomText, .slide9BottomText, .slide11BottomText";
  const topTextSelector =
    ".slide2TextContainer, .slide3TextContainer, .slide4TextContainer, .slide5TextContainer, .slide6TextContainer, .slide7TextContainer, .slide8TextContainer, .slide9TextContainer, .slide10TextContainer, .slide11TextContainer, .slide15TextContainer, .slide16TextContainer, .slide17TextContainer";

  if (!bg || slides.length === 0) return;
 

  const FADE_MS = 300; // Match the CSS Time currently .3 seconds
  let activeBg = null;
  let transitionToken = 0; // Overwrites old transitions

  function setBgInstant(url) {
    bg.style.backgroundImage = `url("${url}")`;
    activeBg = url;
  }

  async function changeBg(url) {
    if (!url || url === activeBg) return;
    const myToken = ++transitionToken;

    bg.classList.add("is-fading");

    await new Promise((r) => setTimeout(r, FADE_MS));
    if (myToken !== transitionToken) return; 

    setBgInstant(url);

    bg.classList.remove("is-fading");
  }

  function pickMostVisibleSlide() {
    let bestSlide = slides[0];
    let bestRatio = -1;
    const viewportHeight = window.innerHeight;

    slides.forEach((slide) => {
      const rect = slide.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, viewportHeight);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const ratio = rect.height > 0 ? visibleHeight / rect.height : 0;

      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestSlide = slide;
      }
    });

    return bestSlide;
  }

  setBgInstant(pickMostVisibleSlide().dataset.bg);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const url = visible.target.dataset.bg;
      changeBg(url);
    },
    { threshold: [0.5] } //Change this to change active slide dection 
  );

  slides.forEach((s) => observer.observe(s));
  window.addEventListener("load", () => {
    setBgInstant(pickMostVisibleSlide().dataset.bg);
  });

  let isSlide1Visible = false;

  if (allSlides.length > 0) {
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
          if (slide1 && entry.target === slide1) {
            isSlide1Visible = entry.isIntersecting;
          }
        });
      },
      { threshold: [0.3] }
    );

    allSlides.forEach((s) => fadeObserver.observe(s));
  }

  if (textSlides.length > 0) {
    const textTriggers = textSlides
      .map((slide) => {
        const topTrigger = slide.querySelector(topTextSelector);
        const bottomTrigger = slide.querySelector(bottomTextSelector);
        return { slide, topTrigger, bottomTrigger };
      })
      .filter(({ topTrigger, bottomTrigger }) => !!topTrigger || !!bottomTrigger);

    let textRafId = null;

    const updateTextVisibility = () => {
      textRafId = null;
      const defaultMinY = window.innerHeight * 0.2;
      const defaultMaxY = window.innerHeight * 0.8;
      const tightMinY = window.innerHeight * 0.35;
      const tightMaxY = window.innerHeight * 0.65;

      textTriggers.forEach(({ slide, topTrigger, bottomTrigger }) => {
        const useTightRange = slide.classList.contains("tight-text");
        const minY = useTightRange ? tightMinY : defaultMinY;
        const maxY = useTightRange ? tightMaxY : defaultMaxY;
        const topRect = topTrigger ? topTrigger.getBoundingClientRect() : null;
        const bottomRect = bottomTrigger ? bottomTrigger.getBoundingClientRect() : null;
        const topCenterY = topRect ? topRect.top + topRect.height * 0.5 : null;
        const bottomCenterY = bottomRect ? bottomRect.top + bottomRect.height * 0.5 : null;
        const effectiveTopY = topCenterY ?? bottomCenterY;
        const effectiveBottomY = bottomCenterY ?? topCenterY;

        const isTopOk = effectiveTopY === null ? true : effectiveTopY >= minY;
        const isBottomOk = effectiveBottomY === null ? true : effectiveBottomY <= maxY;
        const isVisible = isTopOk && isBottomOk;
        slide.classList.toggle("text-visible", isVisible);
      });
    };

    const scheduleTextVisibility = () => {
      if (textRafId !== null) return;
      textRafId = requestAnimationFrame(updateTextVisibility);
    };

    window.addEventListener("scroll", scheduleTextVisibility, { passive: true });
    window.addEventListener("resize", scheduleTextVisibility);
    updateTextVisibility();
  }

  if (phoneOverlay && overlaySlides.length > 0) {
    const overlayRatios = new Map(overlaySlides.map((slide) => [slide, 0]));
    const darkSet = new Set(darkCircleSlides);
    const thresholds = [0, 0.2, 0.4, 0.6, 0.8, 1];
    let slide12Ratio = 0;

    const overlayObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (slide12 && entry.target === slide12) {
            slide12Ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
            return;
          }
          overlayRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let activeSlide = null;
        let maxRatio = 0;

        overlayRatios.forEach((ratio, slide) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            activeSlide = slide;
          }
        });

        const isOverlayVisible = maxRatio > 0 && !isSlide1Visible && slide12Ratio === 0;
        const isDark = isOverlayVisible && activeSlide && darkSet.has(activeSlide);

        phoneOverlay.classList.toggle("is-visible", isOverlayVisible);
        document.body.classList.toggle("phone-circle-visible", isOverlayVisible);
        phoneOverlay.classList.toggle("is-dark-circle", isDark);
        if (phone) {
          // Keep the phone hidden when the overlay fades out to avoid a flash.
          phone.classList.toggle("hidden", isDark || !isOverlayVisible);
        }
      },
      { threshold: thresholds }
    );

    overlaySlides.forEach((s) => overlayObserver.observe(s));
    if (slide12) {
      overlayObserver.observe(slide12);
    }
  }
});
