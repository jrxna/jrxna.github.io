const MobileMenu = () => {
  return (
    <a
      href="https://youtube.com/@jrxna"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Videos"
      title="Videos"
    >
      <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 8-6 4 6 4V8Z"></path>
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
      </svg>
      <span className="sr-only">Open YouTube channel (external link)</span>
    </a>
  )
}

export default MobileMenu
