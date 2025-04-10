'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'

export function SdkInitializer() {
  useEffect(() => {
    const initializeSdk = async () => {
      try {
        // Initialize the SDK and hide the loading screen
        await sdk.actions.ready()
        console.log("Farcaster SDK initialized")
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error)
      }
    }

    initializeSdk()
  }, [])

  return null // This component doesn't render anything
} 