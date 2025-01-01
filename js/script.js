// Select DOM elements
var body = document.querySelector("body");
const CSnavbarMenu = document.querySelector("#cs-navigation");
const navigationMenuOverlay = document.querySelector("#menu-overlay")
const CShamburgerMenu = document.querySelector("#cs-navigation .cs-toggle");

if (CShamburgerMenu) {
    // Add event listener for the mobile menu toggle
    CShamburgerMenu.addEventListener('click', function () {
        CShamburgerMenu.classList.toggle("cs-active");
        CSnavbarMenu.classList.toggle("cs-active");

        body.classList.toggle("cs-open");
        ariaExpanded();

        const active = navigationMenuOverlay.classList.toggle("active");
        console.log(active);
        toggleScrolling(active);

    });
}

function toggleScrolling(disable) {
  if (disable) {
    body.style.overflow = 'hidden'; // Disable scrolling
  } else {
    body.style.overflow = ''; // Enable scrolling
  }
}

function ariaExpanded() {
    const csUL = document.querySelector('#menu-overlay');
    if (csUL) {
        const csExpanded = csUL.getAttribute('aria-expanded');
        csUL.setAttribute('aria-expanded', csExpanded === 'false' ? 'true' : 'false');
    }
}

document.addEventListener('scroll', () => {
    const scroll = document.documentElement.scrollTop;
    if (scroll >= 100) {
        body.classList.add('scroll');
    } else {
        body.classList.remove('scroll');
    }
});