"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface DropZoneProps {
  onFiles: (files: FileList | File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export function DropZone({ onFiles, accept = "image/*", multiple = true, disabled = false, className, children }: DropZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(false)
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      onFiles(multiple ? e.dataTransfer.files : [e.dataTransfer.files[0]])
    }
  }

  const onClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    onFiles(multiple ? e.target.files : [e.target.files[0]])
    // reset so same file can be re-selected
    e.currentTarget.value = ""
  }

  return (
    <div
      role="button"
      aria-disabled={disabled}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-center justify-center border border-dashed rounded-md p-6 text-center transition-colors",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30",
        !disabled && !isDragging && "hover:border-primary/60 hover:bg-primary/5",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={onChange}
        disabled={disabled}
      />
      {children ?? (
        <>
          <p className="text-sm text-muted-foreground">Trage și plasează fișierele aici sau fă click pentru a selecta</p>
          <p className="text-xs text-muted-foreground mt-1">Acceptat: {accept || "orice"}{multiple ? " • Poți selecta multiple fișiere" : ""}</p>
        </>
      )}
    </div>
  )
}

export default DropZone


