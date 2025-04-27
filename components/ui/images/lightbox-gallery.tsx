'use client'

import Image from 'next/image'
import { useState } from 'react'

import ImageLightbox from '@/components/ui/images/image-lightbox'

interface LightboxGalleryProps {
  /** Array of image URLs to display */
  images: string[]
  /** Optional prefix for alt text in images */
  altPrefix?: string
  /** Image width passed to next/image */
  width?: number
  /** Image height passed to next/image */
  height?: number
  /** Additional CSS classes for each image */
  imageClassName?: string
}

/**
 * LightboxGallery displays a grid of images. Clicking an image
 * opens a lightbox with next/prev navigation for the entire set.
 */
export default function LightboxGallery({
  images,
  altPrefix = 'lightbox-image-',
  width = 400,
  height = 250,
  imageClassName = '',
}: LightboxGalleryProps) {
  const [open, setOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  function handleClick(index: number) {
    setLightboxIndex(index)
    setOpen(true)
  }

  return (
    <>
      <div className='flex flex-wrap gap-6'>
        {images.map((src, index) => (
          <Image
            key={index}
            src={src}
            alt={`${altPrefix}${index}`}
            width={width}
            height={height}
            className={`border-border cursor-pointer rounded-md border shadow-sm ${imageClassName}`}
            onClick={() => handleClick(index)}
          />
        ))}
      </div>

      <ImageLightbox
        images={images}
        open={open}
        onClose={() => setOpen(false)}
        startIndex={lightboxIndex}
      />
    </>
  )
}
