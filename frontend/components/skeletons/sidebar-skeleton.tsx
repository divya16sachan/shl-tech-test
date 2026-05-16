import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const SidebarSkeleton = () => {
  return (
    <ul className='space-y-1'>
        {[...Array(10)].map((_,idx)=>(
            <Skeleton key={idx} className="w-full h-8" />
        ))}
    </ul>
  )
}

export default SidebarSkeleton