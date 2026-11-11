'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PawPrint, X } from '@phosphor-icons/react'
import { Button } from '@heroui/react'
import { NAVIGATION } from '@/config/navigation'
import './NoriPet.css'

const preferenceKey = 'nexora:nori-hidden'
const preferenceEvent = 'nexora:nori-preference'
const destinations = new Set([
  '/workspace/relationships', '/workspace/incentives', '/workspace/approvals',
  '/workspace/payments', '/workspace/audit', '/tour',
])
const menu = NAVIGATION.filter(item => destinations.has(item.href))
let hiddenInMemory = false

function readPreference() {
  try { return localStorage.getItem(preferenceKey) === '1' } catch { return hiddenInMemory }
}

function subscribe(notify: () => void) {
  window.addEventListener(preferenceEvent, notify)
  window.addEventListener('storage', notify)
  return () => {
    window.removeEventListener(preferenceEvent, notify)
    window.removeEventListener('storage', notify)
  }
}

function setPreference(hidden: boolean) {
  hiddenInMemory = hidden
  try { localStorage.setItem(preferenceKey, hidden ? '1' : '0') } catch { /* In-memory fallback. */ }
  window.dispatchEvent(new Event(preferenceEvent))
}

function Cat() {
  return <span className="nori-cat" aria-hidden="true">
    <span className="nori-tail" />
    <span className="nori-body"><span className="nori-bib" /><span className="nori-feet" /></span>
    <span className="nori-head">
      <span className="nori-ear nori-ear-left" /><span className="nori-ear nori-ear-right" />
      <span className="nori-headset" />
      <span className="nori-face"><span className="nori-eyes" /></span>
    </span>
  </span>
}

export function NoriPet() {
  const pathname = usePathname()
  const hidden = useSyncExternalStore(subscribe, readPreference, () => false)
  const [openAt, setOpenAt] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const open = openAt === pathname && !hidden

  useEffect(() => {
    const panel = dialog.current
    if (open && panel && !panel.open) panel.showModal()
    if (!open && panel?.open) panel.close()
  }, [open])

  function closePanel() {
    setOpenAt(null)
  }

  return <div className="nori-dock">
    <Button
      ref={launcher}
      className="nori-launcher"
      variant="outline"
      aria-label={hidden ? '노리 다시 표시' : '노리 업무 메뉴 열기'}
      aria-haspopup={hidden ? undefined : 'dialog'}
      aria-expanded={hidden ? undefined : open}
      aria-controls={hidden ? undefined : 'nori-menu'}
      onPress={() => hidden ? setPreference(false) : setOpenAt(pathname)}
    >
      {hidden ? <PawPrint size={20} weight="fill" aria-hidden="true" /> : <span key={pathname} className="nori-arrival"><Cat /></span>}
      <span>{hidden ? '노리 표시' : '노리'}</span>
    </Button>
    <dialog
      ref={dialog}
      id="nori-menu"
      className="nori-panel rounded-card border border-default bg-content text-default"
      aria-labelledby="nori-title"
      onClose={() => { closePanel(); launcher.current?.focus({ preventScroll: true }) }}
      onClick={event => { if (event.target === event.currentTarget) closePanel() }}
    >
      <div className="nori-panel-content">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="nori-greeting"><Cat /></span>
            <div><h2 className="t-card-title" id="nori-title">노리 · NORI</h2><p className="t-small">안녕하세요! 어디로 안내할까요?</p></div>
          </div>
          <Button isIconOnly size="sm" variant="ghost" aria-label="노리 메뉴 닫기" onPress={closePanel}><X size={18} /></Button>
        </header>
        <nav aria-label="노리 업무 바로가기" className="nori-links">
          {menu.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={closePanel} aria-current={pathname === href ? 'page' : undefined} className="nori-link t-small text-default">
            <Icon size={18} aria-hidden="true" className="text-primary" /><span>{label}</span>
          </Link>)}
        </nav>
        <Button variant="ghost" size="sm" onPress={() => { closePanel(); setPreference(true) }}>노리 숨기기</Button>
      </div>
    </dialog>
  </div>
}
