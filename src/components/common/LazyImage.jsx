import { useState, useRef, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { fadeVariants, skeletonVariants } from '../../utils/animations'

const LazyImage = memo(({
  src,
  alt,
  className = '',
  placeholderClassName = '',
  fallbackSrc = null,
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)
  const observerRef = useRef(null)

  useEffect(() => {
    const currentImg = imgRef.current
    
    // Set up intersection observer for lazy loading
    if (currentImg && 'IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true)
              observerRef.current?.unobserve(entry.target)
            }
          })
        },
        {
          rootMargin: '50px' // Start loading 50px before the image comes into view
        }
      )

      observerRef.current.observe(currentImg)
    } else {
      // Fallback for browsers without IntersectionObserver
      setIsInView(true)
    }

    return () => {
      if (observerRef.current && currentImg) {
        observerRef.current.unobserve(currentImg)
      }
    }
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad()
  }

  const handleError = () => {
    setHasError(true)
    onError()
  }

  const imageSrc = hasError && fallbackSrc ? fallbackSrc : src

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <motion.div
          variants={skeletonVariants}
          animate="animate"
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 ${placeholderClassName}`}
        />
      )}

      {/* Actual image */}
      {isInView && (
        <motion.img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          variants={fadeVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          {...props}
        />
      )}

      {/* Error fallback */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      )}
    </div>
  )
})

LazyImage.displayName = 'LazyImage'

export default LazyImage