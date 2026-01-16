window.addEventListener("DOMContentLoaded", () => {
  const bg = document.querySelector(".bg");
  const slides = Array.from(document.querySelectorAll(".slide[data-bg]"));
  const allSlides = Array.from(document.querySelectorAll(".slide"));
  const startButton = document.querySelector("#startButton");
  const slide2 = document.querySelector(".slide2");
  const phoneOverlay = document.querySelector(".phoneOverlay");
  const phone = document.querySelector('.slide2Phone');
  const phoneSlides = Array.from(
    document.querySelectorAll(
      ".slide2, .slide3, .slide4, .slide5, .slide6, .slide7, .slide8, .slide9, .slide10, .slide11"
    )
  );
  const darkCircleSlides = Array.from(
    document.querySelectorAll(".slide8, .slide9, .slide10, .slide11")
  );

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

  setBgInstant(slides[0].dataset.bg);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      const url = visible.target.dataset.bg;
      changeBg(url);
    },
    { threshold: [0.6] } //Change this to change active slide dection 
  );

  slides.forEach((s) => observer.observe(s));

  if (allSlides.length > 0) {
    const fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { threshold: [0.3] }
    );

    allSlides.forEach((s) => fadeObserver.observe(s));
  }

  if (phoneOverlay && phoneSlides.length > 0) {
    const visiblePhoneSlides = new Set();
    const phoneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visiblePhoneSlides.add(entry.target);
          } else {
            visiblePhoneSlides.delete(entry.target);
          }
        });

        if (visiblePhoneSlides.size > 0) {
          phoneOverlay.classList.add("is-visible");
          phone.classList.remove('hidden');
        } else {
          phoneOverlay.classList.remove("is-visible");
          phone.classList.add('hidden');
        }
      },
      { threshold: [.7] }
    );

    phoneSlides.forEach((s) => phoneObserver.observe(s));
  }

  if (phoneOverlay && darkCircleSlides.length > 0) {
    const visibleDarkSlides = new Set();
    const darkCircleObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleDarkSlides.add(entry.target);
            phone.classList.add('hidden');
          } else {
            visibleDarkSlides.delete(entry.target);
            phone.classList.remove('hidden');
          }
        });

        phoneOverlay.classList.toggle(
          "is-dark-circle",
          visibleDarkSlides.size > 0
        );
      },
      { threshold: [0.5] }
    );

    darkCircleSlides.forEach((s) => darkCircleObserver.observe(s));
  }
});
