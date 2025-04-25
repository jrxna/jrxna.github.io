// Select DOM elements
const body = document.querySelector("body");
const CSnavbarMenu = document.querySelector("#jrxna-navigation");
const navigationMenuOverlay = document.querySelector("#menu-overlay");
const CShamburgerMenu = document.querySelector("#jrxna-navigation .jrxna-navigation-menu-toggle");

// Navigation Menu Toggle
if (CShamburgerMenu) {
    CShamburgerMenu.addEventListener('click', function () {
        CShamburgerMenu.classList.toggle("jrxna-navigation-toggle-active");
        CSnavbarMenu.classList.toggle("jrxna-navigation-toggle-active");
        body.classList.toggle("cs-open");
        ariaExpanded();
        const active = navigationMenuOverlay.classList.toggle("active");
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

// Scroll to Section
function scrollToSection(sectionId) {
    const navHeight = 80;
    const element = document.querySelector(sectionId);
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset - navHeight;
    window.scrollTo({top: elementPosition, behavior: 'smooth'});
}

// Add scroll class to navigation
window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
        body.classList.add('scroll');
    } else {
        body.classList.remove('scroll');
    }
});
