'use client'

import { useState } from 'react'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success'
  onClick?: () => void
  className?: string
  isLoading?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  onClick,
  className = '',
  isLoading = false,
}: ButtonProps) {
  const [isLocalLoading, setIsLocalLoading] = useState(false)

  const handleClick = async () => {
    if (onClick) {
      setIsLocalLoading(true)
      try {
        await onClick()
      } finally {
        setIsLocalLoading(false)
      }
    }
  }

  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]'
  const variantStyles = {
    primary: 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 shadow-lg shadow-indigo-500/25',
    secondary: 'bg-gradient-to-r from-pink-600 to-pink-500 text-white hover:from-pink-700 hover:to-pink-600 shadow-lg shadow-pink-500/25',
    success: 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/25',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${
        (isLoading || isLocalLoading) ? 'opacity-50 cursor-not-allowed scale-100' : ''
      }`}
      onClick={handleClick}
      disabled={isLoading || isLocalLoading}
    >
      {isLoading || isLocalLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  )
} 