'use client'

import { ClassroomDetail } from '@/components/classroom/ClassroomDetail'

interface PageProps {
  params: {
    id: string
  }
}

export default function ClassroomPage({ params }: PageProps) {
  return <ClassroomDetail classroomId={params.id} />
}