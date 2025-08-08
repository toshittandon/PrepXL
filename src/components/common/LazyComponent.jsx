import { useState, useRef, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { fadeVariants } from '../../utils/animations'
import LoadingSpinner from './LoadingSpinner'

const LazyComponent = memo(({
  children,
  fallback = <LoadingSpinner size="md" />,
  rootMargin = '100px',
  threshold = 0.1,
  className = '',
  ...props
}) => {
  const [isInView, setIsInView] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const containerRef = useRef(null)
  const observerRef = useRef(null)

  useEffect(() => {
    const currentContainer = containerRef.current
    
    if (currentContainer && 'IntersectionObserver' in window) {
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
          rootMargin,
          threshold
        }
      )

      observerRef.current.observe(currentContainer)
    } else {
      // Fallback for browsers without IntersectionObserver
      setIsInView(true)
    }

    return () => {
      if (observerRef.current && currentContainer) {
        observerRef.current.unobserve(currentContainer)
      }
    }
  }, [rootMargin, threshold])

  useEffect(() => {
    if (isInView) {
      // Simulate loading time for smooth transition
      const timer = setTimeout(() => {
        setHasLoaded(true)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isInView])

  return (
    <div ref={containerRef} className={className} {...props}>
      {!isInView || !hasLoaded ? (
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center p-8"
        >
          {fallback}
        </motion.div>
      ) : (
        <motion.div
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
        >
          {children}
        </motion.div>
      )}
    </div>
  )
})

LazyComponent.displayName = 'LazyComponent'

export default LazyComponent