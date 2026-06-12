import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MissionEditor } from '@/components/MissionEditor'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  return { title: `Propose Solution | SPACE Y?` }
}

export default async function SolvePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: question } = await supabase
    .from('questions')
    .select('id, slug, title')
    .eq('slug', slug)
    .neq('status', 'removed')
    .single()

  if (!question) notFound()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = question as any

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-[#8A94B0] text-sm mb-1">Proposing solution for</p>
        <h1 className="font-heading font-bold text-xl text-[#E8EDF4]">{q.title}</h1>
      </div>
      <MissionEditor questionId={q.id} questionSlug={q.slug} />
    </div>
  )
}
