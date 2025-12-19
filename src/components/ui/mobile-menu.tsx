import { Button } from '@/components/ui/button'

const MobileMenu = () => {
  return (
    <a
      href="https://youtube.com/@jrxna"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Button variant="outline" size="icon" title="Videos">
        <span>Videos</span>
        <span className="sr-only">Open YouTube channel (external link)</span>
      </Button>
    </a>
  )
}

export default MobileMenu
