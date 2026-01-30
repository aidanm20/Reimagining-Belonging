let isSlide24Active = false;
let isSlide25Active = false;

window.addEventListener("DOMContentLoaded", () => {
  const bgLayers = Array.from(document.querySelectorAll(".bg"));
  const slides = Array.from(document.querySelectorAll(".slide[data-bg]"));
  const allSlides = Array.from(document.querySelectorAll(".slide"));
  const startButton = document.querySelector("#startButton");
  const slide1 = document.querySelector(".slide1");
  const slide2 = document.querySelector(".slide2");
  const slide6 = document.querySelector(".slide6");
  const slide11 = document.querySelector(".slide11");
  const slide12 = document.querySelector(".slide12");
  const slide16 = document.querySelector(".slide16");
  const slide24 = document.querySelector(".slide24");
  const slide25 = document.querySelector(".slide25");
  const slide24Text = document.querySelector(".slide24TextContainer");
  const slide16Text = document.querySelector(".slide16TextContainer");
  const phoneOverlay = document.querySelector(".phoneOverlay");
  const phone = document.querySelector('.slide2Phone');
  const phoneSlides = Array.from(
    document.querySelectorAll(
      ".slide2, .slide3, .slide4, .slide5, .slide6"
    )
  );
  const phoneBgUrls = [
    "./images/section01-scroll-1.png",
    "./images/section01-scroll-2.png"
  ];
  let lastPhoneBg = "";
  let phoneFadeTimeout = null;
  let isSlide7Fadeout = false;
  const overlaySlides = Array.from(
    document.querySelectorAll(
      ".slide2, .slide3, .slide4, .slide5, .slide6, .slide8, .slide9, .slide10, .slide11"
    )
  );
  const darkCircleSlides = Array.from(
    document.querySelectorAll(".slide8, .slide9, .slide10, .slide11")
  );
  const textSlides = Array.from(
    document.querySelectorAll(
      ".slide2, .slide3, .slide4, .slide5, .slide6, .slide8, .slide9, .slide10, .slide11, .slide15, .slide16, .slide17, .slide18"
    )
  );
  const bottomTextSelector =
    ".slide6BottomText, .slide8BottomText, .slide9BottomText, .slide11BottomText";
  const topTextSelector =
    ".slide2TextContainer, .slide3TextContainer, .slide4TextContainer, .slide5TextContainer, .slide6TextContainer, .slide7TextContainer, .slide8TextContainer, .slide9TextContainer, .slide10TextContainer, .slide11TextContainer, .slide15TextContainer, .slide16TextContainer, .slide17TextContainer, .slide26TextContainer, slide21TextContainer, slide23TextContainer, slide22TextContainer";

  if (bgLayers.length === 0 || slides.length === 0) return;
 

  const DEFAULT_FADE_MS = 400;

  let activeLayer =
    bgLayers.find((layer) => layer.classList.contains("bg--front")) || bgLayers[0];
  let inactiveLayer =
    bgLayers.find((layer) => layer.classList.contains("bg--back")) || bgLayers[1];

  function applyFadeDuration(durationMs) {
    const resolvedMs = Number.isFinite(durationMs) ? durationMs : DEFAULT_FADE_MS;
    bgLayers.forEach((layer) => {
      layer.style.transitionDuration = `${resolvedMs}ms`;
    });
  }

  function setBgInstant(url) {
    if (!url || !activeLayer) return;
    activeLayer.style.backgroundImage = `url("${url}")`;
    activeLayer.dataset.bgUrl = url;
    activeLayer.classList.add("is-visible");
    if (inactiveLayer && inactiveLayer !== activeLayer) {
      inactiveLayer.classList.remove("is-visible");
    }
  }

  function changeBg(url, fadeMs) {
    if (!url || !activeLayer) return;
    if (activeLayer.dataset.bgUrl === url) return;
    applyFadeDuration(fadeMs);
    if (!inactiveLayer || inactiveLayer === activeLayer) {
      setBgInstant(url);
      return;
    }

    inactiveLayer.style.backgroundImage = `url("${url}")`;
    inactiveLayer.dataset.bgUrl = url;
    inactiveLayer.classList.add("is-visible");
    activeLayer.classList.remove("is-visible");

    const previousActive = activeLayer;
    activeLayer = inactiveLayer;
    inactiveLayer = previousActive;
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

  applyFadeDuration(DEFAULT_FADE_MS);
  setBgInstant(pickMostVisibleSlide().dataset.bg);

  const observer = new IntersectionObserver(
    (entries) => {
      if (isSlide7Fadeout) return;
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const url = visible.target.dataset.bg;
      const fadeMs = Number.parseInt(visible.target.dataset.fade, 10);
      changeBg(url, fadeMs);
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

  if (slide25) {
    let isSlide25Visible = false;
    let isSlide24TextVisible = false;

    const updateSlide25Swap = () => {
      isSlide25Active = isSlide25Visible && !isSlide24TextVisible;
      document.body.classList.toggle("slide25-active", isSlide25Active);
    };

    const slide25Observer = new IntersectionObserver(
      ([entry]) => {
        isSlide25Visible = entry.isIntersecting;
        updateSlide25Swap();
      },
      { threshold: [0.3] }
    );
    slide25Observer.observe(slide25);

    if (slide24Text) {
      const slide24TextObserver = new IntersectionObserver(
        ([entry]) => {
          isSlide24TextVisible = entry.isIntersecting;
          updateSlide25Swap();
        },
        { threshold: [0.1] }
      );
      slide24TextObserver.observe(slide24Text);
    }
  }

  if (slide24) {
    const slide24Observer = new IntersectionObserver(
      ([entry]) => {
        isSlide24Active = entry.isIntersecting;
        document.body.classList.toggle("slide24-active", isSlide24Active);
      },
      { threshold: [0.3] }
    );
    slide24Observer.observe(slide24);
  }

  let activeOverlaySlide = null;
  let slide11TextVisible = false;
  const syncSlide11Circle = () => {
    if (!phoneOverlay || !slide11) return;
    const shouldFade = activeOverlaySlide === slide11 && !slide11TextVisible;
    phoneOverlay.classList.toggle("slide11-circle-fade", shouldFade);
  };

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
        if (slide11 && slide === slide11) {
          slide11TextVisible = isVisible;
        }
      });
      if (slide16 && slide16Text) {
        const slide16Top = slide16Text.getBoundingClientRect().top;
        slide16.classList.toggle("map-fade", slide16Top <= 0);
      }
      syncSlide11Circle();
    };

    const scheduleTextVisibility = () => {
      if (textRafId !== null) return;
      textRafId = requestAnimationFrame(updateTextVisibility);
    };

    window.addEventListener("scroll", scheduleTextVisibility, { passive: true });
    window.addEventListener("resize", scheduleTextVisibility);
    updateTextVisibility();
  }

  const syncedFades = [
    { trigger: ".slide19TextContainer", targets: [".slide19QuoteContainer"] },
    { trigger: ".slide21TextContainer", targets: [".img21"] },
    { trigger: ".slide22TextContainer", targets: [".img22"] },
    { trigger: ".slide23TextContainer", targets: [".slide23Left", ".slide23Right"] }
  ];

  const fadePairs = syncedFades
    .map((set) => {
      const trigger = document.querySelector(set.trigger);
      const targets = set.targets
        .map((sel) => document.querySelector(sel))
        .filter(Boolean);
      return trigger && targets.length ? { trigger, targets } : null;
    })
    .filter(Boolean);

  if (fadePairs.length > 0) {
    fadePairs.forEach(({ trigger, targets }) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          targets.forEach((el) =>
            el.classList.toggle("block-visible", entry.isIntersecting)
          );
        },
        { threshold: 0.3 }
      );
      observer.observe(trigger);
    });
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
        activeOverlaySlide = activeSlide;
        syncSlide11Circle();

        phoneOverlay.classList.toggle("is-visible", isOverlayVisible);
        document.body.classList.toggle("phone-circle-visible", isOverlayVisible);
        phoneOverlay.classList.toggle("is-dark-circle", isDark);
        if (phone) {
          // Keep the phone hidden when the overlay fades out to avoid a flash.
          phone.classList.toggle("hidden", isDark || !isOverlayVisible);
          if (activeSlide) {
            const phoneIndex = phoneSlides.indexOf(activeSlide);
            if (phoneIndex >= 0) {
              const nextBg = phoneBgUrls[phoneIndex % phoneBgUrls.length];
              if (nextBg !== lastPhoneBg) {
                if (phoneFadeTimeout) {
                  clearTimeout(phoneFadeTimeout);
                }
                phone.classList.add("is-fading");
                phoneFadeTimeout = setTimeout(() => {
                  phone.style.backgroundImage = `url("${nextBg}")`;
                  lastPhoneBg = nextBg;
                  requestAnimationFrame(() => {
                    phone.classList.remove("is-fading");
                  });
                }, 150);
              }
            }
          }
        }
      },
      { threshold: thresholds }
    );

    overlaySlides.forEach((s) => overlayObserver.observe(s));
    if (slide12) {
      overlayObserver.observe(slide12);
    }
  }

  const gradientOrb = document.querySelector(".phoneOrbGradient");
  if (gradientOrb && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.set(gradientOrb, { opacity: 0 });
    gsap.to(gradientOrb, {
      opacity: 0.75,
      ease: "none",
      scrollTrigger: {
        trigger: ".slide8",
        endTrigger: ".slide11",
        start: "top top",
        end: "bottom bottom",
        scrub: true
      }
    });
  }

  const slide6BottomText = document.querySelector(".slide6BottomText");
  const slide6Stage7 = document.querySelector(".slide6Stage7");
  if (slide6BottomText && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.set(slide6BottomText, { scale: 1, opacity: 1, transformOrigin: "center center" });

    gsap.timeline({
      scrollTrigger: {
        trigger: slide6BottomText,
        start: "center center",
        endTrigger: slide6Stage7 || ".slide8",
        end: slide6Stage7 ? "top top" : "top top",
        scrub: true,
        pin: true,
        pinReparent: true,
        onEnter: () => {
          document.body.classList.add("slide6-zoom-active");
          gsap.set(slide6BottomText, { opacity: 1 });
        },
        onEnterBack: () => {
          document.body.classList.add("slide6-zoom-active");
          gsap.set(slide6BottomText, { opacity: 1 });
        },
        onLeave: () => {
          gsap.set(slide6BottomText, { opacity: 0 });
          document.body.classList.remove("slide6-zoom-active");
        },
        onLeaveBack: () => {
          gsap.set(slide6BottomText, { opacity: 0 });
          document.body.classList.remove("slide6-zoom-active");
        },
        invalidateOnRefresh: true
      }
    })
      .to(slide6BottomText, { scale: 1.35, ease: "none", duration: 1 })
      .to(slide6BottomText, { opacity: 0, ease: "none", duration: 0.2 }, 0.8);
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: ".slide8",
      start: "top bottom",
      end: "bottom top",
      toggleClass: { targets: document.body, className: "slide8-active" }
    });
  }

  const slide7Overlay = document.querySelector(".slide7BgOverlay");
  const slide7Text = document.querySelector(".slide7TextContainer");
  if (slide7Overlay && slide6Stage7 && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.set(slide7Overlay, { opacity: 0 });
    if (slide7Text) {
      gsap.set(slide7Text, { scale: 1, opacity: 0, transformOrigin: "center center" });
    }
    const slide7FadeBg = "./images/whiteBackground.png";
    ScrollTrigger.create({
      trigger: slide6Stage7,
      start: "top top",
      endTrigger: slide6Stage7,
      end: "bottom top",
      onEnter: () => {
        isSlide7Fadeout = true;
        document.body.classList.add("slide7-active", "slide7-fadeout");
        changeBg(slide7FadeBg, 500);
      },
      onEnterBack: () => {
        isSlide7Fadeout = false;
        document.body.classList.add("slide7-active");
        document.body.classList.remove("slide7-fadeout");
        setBgInstant(pickMostVisibleSlide().dataset.bg);
      },
      onLeave: () => {
        isSlide7Fadeout = false;
        document.body.classList.remove("slide7-active", "slide7-fadeout");
        setBgInstant(pickMostVisibleSlide().dataset.bg);
      },
      onLeaveBack: () => {
        isSlide7Fadeout = false;
        document.body.classList.remove("slide7-active", "slide7-fadeout");
        setBgInstant(pickMostVisibleSlide().dataset.bg);
      },
      invalidateOnRefresh: true
    });
  }

  const svgMarquee = document.querySelector(".finalSvgMarquee");
  if (svgMarquee) {
    const svgSources = Array.from({ length: 7 }, (_, i) => {
      const index = String(i + 1).padStart(2, "0");
      return `./svg/${index}inline.svg`;
    });

    const buildRow = (row) => {
      const track = row.querySelector(".finalSvgTrack");
      if (!track) return;
      track.innerHTML = "";

      const rowWidth = row.getBoundingClientRect().width || window.innerWidth;
      const minItems = Math.max(10, Math.ceil(rowWidth / 180) + 6);
      const created = [];

      for (let i = 0; i < minItems; i += 1) {
        const img = document.createElement("img");
        img.className = "finalSvgIcon";
        img.src = svgSources[Math.floor(Math.random() * svgSources.length)];
        img.alt = "";
        img.loading = "eager";
        created.push(img);
        track.appendChild(img);
      }

      created.forEach((node) => track.appendChild(node.cloneNode(true)));
    };

    const rows = svgMarquee.querySelectorAll(".finalSvgRow");
    rows.forEach((row) => buildRow(row));

    let marqueeResizeRaf = null;
    const onResize = () => {
      if (marqueeResizeRaf !== null) return;
      marqueeResizeRaf = requestAnimationFrame(() => {
        marqueeResizeRaf = null;
        rows.forEach((row) => buildRow(row));
      });
    };
    window.addEventListener("resize", onResize);
  }
});

/**
 * slide24SVGs
 */
const svg241 = document.getElementById("slide24SVG1");
const popup1 = document.querySelector(".svg1popupContainer");
const popupSelector = ".svg1popupContainer, .svg2popupContainer, .svg3popupContainer, .svg4popupContainer, .svg5popupContainer, .svg6popupContainer, .svg7popupContainer, .popWinContainer1, .popWinContainer2, .popWinContainer3, .popWinContainer4, .popWinContainer5, .popWinContainer6, .popWinContainer7";
const popups = Array.from(document.querySelectorAll(popupSelector));

const popupSlideSelector = ".slide24, .slide25";
const isPopupOpen = () =>
  popups.some(
    (popup) =>
      !popup.classList.contains("hidden") &&
      popup.closest(popupSlideSelector)
  );
const updatePopupState = () => {
  const shouldAllowPopup = isSlide24Active || isSlide25Active;
  if (!shouldAllowPopup) {
    popups.forEach((popup) => popup.classList.add("hidden"));
  }
  document.body.classList.toggle("popup-open", shouldAllowPopup && isPopupOpen());
};
window.addEventListener("click", updatePopupState);
window.addEventListener("scroll", updatePopupState, { passive: true });
window.addEventListener("touchstart", updatePopupState, { passive: true });

if (svg241 && popup1) {
  svg241.addEventListener("load", () => {
    const svgDoc = svg241.contentDocument;
    const svgRoot = svgDoc.documentElement;
    if (!svgRoot) return;
    svgRoot.addEventListener("click", () => {
      if (!isSlide24Active) return;
      popup1.classList.remove("hidden");
      updatePopupState();
      console.log("hi")
    });
  });
}

const svg242 = document.getElementById("slide24SVG2");
const popup2 = document.querySelector(".svg2popupContainer");

if (svg242 && popup1) {
  svg242.addEventListener("load", () => {
    const svgDoc = svg242.contentDocument;
    const svgRoot = svgDoc.documentElement;
    if (!svgRoot) return;
    svgRoot.addEventListener("click", () => {
      if (!isSlide24Active) return;
      popup2.classList.remove("hidden");
      updatePopupState();
      console.log("hi")
    });
  });
}

const svg243 = document.getElementById("slide24SVG3");
const popup3 = document.querySelector(".svg3popupContainer");

if (svg243 && popup1) {
  svg243.addEventListener("load", () => {
    const svgDoc = svg243.contentDocument;
    const svgRoot = svgDoc.documentElement;
    if (!svgRoot) return;
    svgRoot.addEventListener("click", () => {
      if (!isSlide24Active) return;
      popup3.classList.remove("hidden");
      updatePopupState();
      console.log("hi")
    });
  });
}

const svg244 = document.getElementById("slide24SVG4");
const popup4 = document.querySelector(".svg4popupContainer");

if (svg244 && popup1) {
  svg244.addEventListener("load", () => {
    const svgDoc = svg244.contentDocument;
    const svgRoot = svgDoc.documentElement;
    if (!svgRoot) return;
    svgRoot.addEventListener("click", () => {
      if (!isSlide24Active) return;
      popup4.classList.remove("hidden");
      updatePopupState();
      console.log("hi")
    });
  });
}

const svg245 = document.getElementById("slide24SVG5");
const popup5 = document.querySelector(".svg5popupContainer");

if (svg245 && popup1) {
  svg245.addEventListener("load", () => {
    const svgDoc = svg245.contentDocument;
    const svgRoot = svgDoc.documentElement;
    if (!svgRoot) return;
    svgRoot.addEventListener("click", () => {
      if (!isSlide24Active) return;
      popup5.classList.remove("hidden");
      updatePopupState();
      console.log("hi")
    });
  });
}

const svg246 = document.getElementById("slide24SVG6");
const popup6 = document.querySelector(".svg6popupContainer");

if (svg246 && popup1) {
  svg246.addEventListener("load", () => {
    const svgDoc = svg246.contentDocument;
    const svgRoot = svgDoc.documentElement;
    if (!svgRoot) return;
    svgRoot.addEventListener("click", () => {
      if (!isSlide24Active) return;
      popup6.classList.remove("hidden");
      updatePopupState();
      console.log("hi")
    });
  });
}

const svg247 = document.getElementById("slide24SVG7");
const popup7 = document.querySelector(".svg7popupContainer");

if (svg247 && popup1) {
  svg247.addEventListener("load", () => {
    const svgDoc = svg247.contentDocument;
    const svgRoot = svgDoc.documentElement;
    if (!svgRoot) return;
    svgRoot.addEventListener("click", () => {
      if (!isSlide24Active) return;
      popup7.classList.remove("hidden");
      updatePopupState();
      console.log("hi")
    });
  });
}

const closeButtons = document.querySelectorAll('.closeButton');
 
if (closeButtons.length > 0) {
  closeButtons.forEach((btn) => {
    btn.addEventListener("load", () => {
    const closeButtonDoc = btn.contentDocument;
    const closeButtonRoot = closeButtonDoc.documentElement;
    if (!closeButtonRoot) return;
    closeButtonRoot.addEventListener("click", () => {
      const popup = btn.closest(".svg1popupContainer, .svg2popupContainer, .svg3popupContainer, .svg4popupContainer, .svg5popupContainer, .svg6popupContainer, .svg7popupContainer, .popWinContainer2, .popWinContainer3, .popWinContainer4, .popWinContainer5, .popWinContainer6, .popWinContainer7, .popWinContainer1");
      if (popup) {
        popup.classList.add("hidden");
        updatePopupState();
      }
      
    });
  });
  });
   
}

/**
 * Slide 25 
 */

const imgContainer = document.querySelector(".imgContainer");
const popWin1 = document.querySelector(".popWinContainer1");

if (imgContainer && popWin1) {
  imgContainer.addEventListener("click", () => {
    if (!isSlide25Active) return;
    popWin1.classList.remove("hidden");
    updatePopupState();
    console.log("hi")
  });
}

const imgContainer2 = document.querySelector(".imgContainer2");
const popWin2 = document.querySelector(".popWinContainer2");

if (imgContainer2 && popWin2) {
  imgContainer2.addEventListener("click", () => {
    if (!isSlide25Active) return;
    popWin2.classList.remove("hidden");
    updatePopupState();
    console.log("hi")
  });
}

const imgContainer3 = document.querySelector(".imgContainer3");
const popWin3 = document.querySelector(".popWinContainer3");

if (imgContainer3 && popWin3) {
  imgContainer3.addEventListener("click", () => {
    if (!isSlide25Active) return;
    popWin3.classList.remove("hidden");
    updatePopupState();
    console.log("hi")
  });
}

const imgContainer4 = document.querySelector(".imgContainer4");
const popWin4 = document.querySelector(".popWinContainer4");

if (imgContainer4 && popWin4) {
  imgContainer4.addEventListener("click", () => {
    if (!isSlide25Active) return;
    popWin4.classList.remove("hidden");
    updatePopupState();
    console.log("hi")
  });
}

const imgContainer5 = document.querySelector(".imgContainer5");
const popWin5 = document.querySelector(".popWinContainer5");

if (imgContainer5 && popWin5) {
  imgContainer5.addEventListener("click", () => {
    if (!isSlide25Active) return;
    popWin5.classList.remove("hidden");
    updatePopupState();
    console.log("hi")
  });
}

const imgContainer6 = document.querySelector(".imgContainer6");
const popWin6 = document.querySelector(".popWinContainer6");

if (imgContainer6 && popWin6) {
  imgContainer6.addEventListener("click", () => {
    if (!isSlide25Active) return;
    popWin6.classList.remove("hidden");
    updatePopupState();
    console.log("hi")
  });
}

const imgContainer7 = document.querySelector(".imgContainer7");
const popWin7 = document.querySelector(".popWinContainer7");

if (imgContainer7 && popWin7) {
  imgContainer7.addEventListener("click", () => {
    if (!isSlide25Active) return;
    popWin7.classList.remove("hidden");
    updatePopupState();
    console.log("hi")
  });
}

/**
 * Hover Animation slide 19
 */
const slide19 = document.querySelector(".slide19");
const slide19Drawings = document.querySelectorAll(".slide19Drawing");
const slide19Quotes = document.querySelectorAll(".slide19QuoteContainer img");

if (slide19 && slide19Drawings.length && slide19Quotes.length) {
  const centerDrawingInSlide = (drawingEl) => {
    const slideRect = slide19.getBoundingClientRect();
    const drawingRect = drawingEl.getBoundingClientRect();
    const desiredHeight = window.innerHeight * 0.6;
    const scale = desiredHeight / drawingRect.height;
    const slideCenterX = slideRect.left + slideRect.width / 2;
    const slideCenterY = slideRect.top + slideRect.height / 2;
    const drawingCenterX = drawingRect.left + drawingRect.width / 2;
    const drawingCenterY = drawingRect.top + drawingRect.height / 2;
    const dx = slideCenterX - drawingCenterX;
    const dy = slideCenterY - drawingCenterY - 50;
    drawingEl.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
  };

  const isWithin = (rect, x, y) => (
    x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  );

  let activeDrawing = null;
  let activeQuote = null;
  let activeOriginRect = null;

  const resetActive = () => {
    if (!activeDrawing || !activeQuote) return;
    activeQuote.style.opacity = "0";
    activeDrawing.style.transform = "translate3d(0px, 0px, 0) scale(1)";
    activeDrawing = null;
    activeQuote = null;
    activeOriginRect = null;
    document.removeEventListener("mousemove", onPointerMove);
  };

  const onPointerMove = (event) => {
    if (!activeDrawing || !activeOriginRect) return;
    const currentRect = activeDrawing.getBoundingClientRect();
    const withinOrigin = isWithin(activeOriginRect, event.clientX, event.clientY);
    const withinCurrent = isWithin(currentRect, event.clientX, event.clientY);
    if (withinOrigin || withinCurrent) return;
    resetActive();
  };

  slide19Drawings.forEach((drawingEl, index) => {
    const quoteEl = slide19Quotes[index];
    if (!quoteEl) return;

    drawingEl.addEventListener("mouseenter", () => {
      if (activeDrawing === drawingEl) return;
      if (activeDrawing && activeDrawing !== drawingEl) {
        resetActive();
      }
      activeDrawing = drawingEl;
      activeQuote = quoteEl;
      activeOriginRect = drawingEl.getBoundingClientRect();
      activeQuote.style.opacity = "1";
      centerDrawingInSlide(drawingEl);
      document.addEventListener("mousemove", onPointerMove);
    });
  });
}

//Slide20-24 Orbs animation
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

const leftOrb = document.querySelector(".slide20Orb--left");
const rightOrb = document.querySelector(".slide20Orb--right");
const lineGroup = document.querySelector(".slide20LineGroup");
const dashedLine = document.querySelector(".slide20Line--dashed");
const solidLines = document.querySelectorAll(".slide20Line--solid");
const solidUp = document.querySelector(".slide20Line--up");
const solidDown = document.querySelector(".slide20Line--down");


//visibility 
const orbs = document.querySelector(".slide20Orbs");
const slide19Section = document.querySelector(".slide19");
const slide23 = document.querySelector(".slide23");
const slide24 = document.querySelector(".slide24");

if (orbs && slide19Section && slide23 && slide24) {
  let hasSeenSlide19Media = false;
  let isInOrbRange = false;

  const updateOrbs = () => {
    const shouldShow = hasSeenSlide19Media && isInOrbRange;
    orbs.classList.toggle("is-visible", shouldShow);
  };

  const obs19 = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      hasSeenSlide19Media = true;
    }
    updateOrbs();
  }, { threshold: 0.3 });

  obs19.observe(slide19Section);

  if (window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: slide23,
      start: "top-=100px top",
      end: () => `top+=${window.innerHeight * 3} top`,
      onEnter: () => {
        isInOrbRange = true;
        updateOrbs();
      },
      onLeave: () => {
        isInOrbRange = false;
        updateOrbs();
      },
      onEnterBack: () => {
        isInOrbRange = true;
        updateOrbs();
      },
      onLeaveBack: () => {
        isInOrbRange = false;
        updateOrbs();
      },
      invalidateOnRefresh: true
    });
  }
}

if (window.gsap && window.ScrollTrigger && orbs && leftOrb && rightOrb && lineGroup && slide23 && slide24) {
  const computeTargets = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const orbSize =
      Number.parseFloat(getComputedStyle(orbs).getPropertyValue("--orb-size")) || 400;
    const edgeInset =
      Number.parseFloat(getComputedStyle(orbs).getPropertyValue("--orb-edge-inset")) || 40;
    const leftEdge = 0.1 * vw;
    const containerWidth = vw - leftEdge * 2;

    const leftOrbLeft = leftEdge;
    const leftTargetLeft = leftEdge + 0.3 * containerWidth;
    const leftDeltaX = leftTargetLeft - leftOrbLeft;
    const leftDeltaY = -0.03 * vh;

    const rightTargetRight = leftEdge + 0.33 * containerWidth;
    const rightCurrentLeft = vw - leftEdge - orbSize;
    const rightTargetLeft = vw - rightTargetRight - orbSize;
    const rightDeltaX = rightTargetLeft - rightCurrentLeft;
    const rightDeltaY = 0.03 * vh;

    const leftLineWithin = 0.3 * containerWidth + orbSize / 1.5 - edgeInset;
    const rightLineWithin = 0.33 * containerWidth + orbSize - edgeInset;
    const lineLeft = leftEdge + leftLineWithin;
    const lineWidth = Math.max(130, containerWidth - leftLineWithin - rightLineWithin);

    return {
      leftDeltaX,
      leftDeltaY,
      rightDeltaX,
      rightDeltaY,
      lineLeft,
      lineWidth
    };
  };

  gsap.timeline({
    scrollTrigger: {
      trigger: slide23,
      start: "top top",
      end: () => `top+=${window.innerHeight} top`,
      scrub: true,
      invalidateOnRefresh: true
    }
  })
    .to(leftOrb, {
      x: () => computeTargets().leftDeltaX,
      y: () => computeTargets().leftDeltaY,
      ease: "none"
    }, 0)
    .to(rightOrb, {
      x: () => computeTargets().rightDeltaX,
      y: () => computeTargets().rightDeltaY,
      ease: "none"
    }, 0)
    .to(lineGroup, {
      left: () => computeTargets().lineLeft,
      width: () => computeTargets().lineWidth,
      rotation: 35,
      transformOrigin: "left center",
      ease: "none"
    }, 0)
    .to(orbs, {
      "--line-stroke": 3,
      ease: "none"
    }, 0);

  if (dashedLine && solidLines.length) {
    ScrollTrigger.create({
      trigger: slide23,
      start: () => `top+=${window.innerHeight * 1.5} top`,
      end: () => `top+=${window.innerHeight * 1.5} top`,
      onEnter: () => {
        gsap.to(dashedLine, { opacity: 0, duration: 0.5, ease: "power2.out" });
        gsap.to(solidLines, { opacity: 1, duration: 0.5, ease: "power2.out" });
      },
      onEnterBack: () => {
        gsap.to(dashedLine, { opacity: 1, duration: 0.5, ease: "power2.out" });
        gsap.to(solidLines, { opacity: 0, duration: 0.5, ease: "power2.out" });
      },
      invalidateOnRefresh: true
    });
  }

  if (solidUp && solidDown) {
    gsap.timeline({
      scrollTrigger: {
        trigger: slide23,
        start: () => `top+=${window.innerHeight * 1.5} top`,
        end: () => `top+=${window.innerHeight * 2.5} top`,
        scrub: true,
        invalidateOnRefresh: true
      }
    })
      .to(solidUp, { rotation: -15, transformOrigin: "center center", ease: "none" }, 0)
      .to(solidDown, { rotation: 15, transformOrigin: "center center", ease: "none" }, 0);
  }
}
