'use client'

import { useId, type ComponentProps } from 'react'
import { Button, toast } from '@heroui/react'

/** A blocked action remains discoverable and explains the next step on press. */
export function ActionButton({ blockedReason, busy, onPress, ...props }: ComponentProps<typeof Button> & {
  blockedReason?: string; busy?: boolean
}) {
  const id = useId()
  return <span className="nx-action">
    <Button {...props} isDisabled={busy} aria-describedby={blockedReason ? id : undefined}
      onPress={async event => {
        if (blockedReason) { toast.warning(blockedReason); return }
        try { await onPress?.(event) } catch { toast.danger('처리를 완료하지 못했습니다. 새로고침 후 상태를 확인하세요.') }
      }} />
    {blockedReason && <span id={id} className="t-caption">{blockedReason}</span>}
  </span>
}
