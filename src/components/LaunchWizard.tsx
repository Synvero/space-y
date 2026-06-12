'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { makeSlug, slugify } from '@/lib/slugs'
import { ORBIT_META, type Orbit } from '@/lib/scoring'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ORBITS = Object.keys(ORBIT_META) as Orbit[]

export function LaunchWizard() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)

  // Step 1
  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [duplicates, setDuplicates] = useState<Array<{ slug: string; title: string }>>([])
  const dupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Step 2
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')

  // Step 3
  const [orbit, setOrbit] = useState<Orbit>('leo')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [launched, setLaunched] = useState(false)
  const [launchedSlug, setLaunchedSlug] = useState('')

  const titleValid = title.toLowerCase().startsWith('why ') && title.length >= 10

  // Duplicate check
  useEffect(() => {
    if (title.length < 6) { setDuplicates([]); return }
    if (dupTimer.current) clearTimeout(dupTimer.current)
    dupTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('questions')
        .select('slug, title')
        .ilike('title', `%${title.slice(0, 30)}%`)
        .neq('status', 'removed')
        .limit(3)
      setDuplicates(data ?? [])
    }, 400)
  }, [title])

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmitError('Please sign in to launch a question')
      setSubmitting(false)
      return
    }

    const slug = makeSlug(title)
    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5)

    const { data, error } = await supabase
      .from('questions')
      .insert({
        author_id: user.id,
        slug,
        title: title.trim(),
        body: body.trim() || null,
        orbit,
        tags: tagArr,
      })
      .select('slug')
      .single()

    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
      return
    }

    setLaunchedSlug(data.slug)
    setLaunched(true)
    setSubmitting(false)
  }

  if (launched) {
    return (
      <div className="bg-[#111729] border border-[#F5C542]/40 rounded-xl p-8 text-center">
        <div className="rocket-trail inline-block text-6xl mb-4">🚀</div>
        <h2 className="font-heading font-bold text-xl text-[#E8ECF8] mb-2">Mission launched!</h2>
        <p className="text-[#8A94B0] mb-6">Your question is live. Now let the crew engineer answers.</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => router.push(`/q/${launchedSlug}`)}
            className="bg-[#FF6B2C] hover:bg-[#FF8A52] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            View Question
          </button>
          <button
            onClick={() => {
              setTitle(''); setBody(''); setTags(''); setOrbit('leo')
              setStep(1); setLaunched(false)
            }}
            className="border border-[#1E2740] text-[#E8ECF8] hover:bg-[#1E2740] px-6 py-2.5 rounded-lg transition-colors"
          >
            Launch Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#111729] border border-[#1E2740] rounded-xl overflow-hidden">
      {/* Step indicator */}
      <div className="flex border-b border-[#1E2740]">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              step === s ? 'text-[#FF6B2C] border-b-2 border-[#FF6B2C]' :
              step > s ? 'text-[#3DDC97]' : 'text-[#8A94B0]'
            }`}
          >
            {s === 1 && 'The Why'}
            {s === 2 && 'Context'}
            {s === 3 && 'Orbit & Launch'}
          </div>
        ))}
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#E8ECF8] text-sm">Your Why…? question</Label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color: titleValid ? '#3DDC97' : '#FF5470' }}
                >
                  Why
                </span>
                <Input
                  value={title.startsWith('Why ') || title.startsWith('why ') ? title.slice(4) : title}
                  onChange={e => {
                    const val = e.target.value
                    const newTitle = val.toLowerCase().startsWith('why ') ? val : `Why ${val}`
                    setTitle(newTitle)
                    if (!newTitle.toLowerCase().startsWith('why ')) {
                      setTitleError('Question must start with "Why "')
                    } else if (newTitle.length < 10) {
                      setTitleError('Too short')
                    } else {
                      setTitleError(null)
                    }
                  }}
                  placeholder="don't plants scream when they're thirsty?"
                  className="pl-12 bg-[#0A0E1A] border-[#1E2740] text-[#E8ECF8] placeholder:text-[#8A94B0]"
                  maxLength={136}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: titleError ? '#FF5470' : '#3DDC97' }}>
                  {titleError ?? (titleValid ? 'Valid Why question' : '')}
                </span>
                <span className="text-[#8A94B0]">{title.length}/140</span>
              </div>
            </div>

            {duplicates.length > 0 && (
              <div className="bg-[#0A0E1A] border border-[#FF6B2C]/30 rounded-lg p-3">
                <p className="text-xs text-[#FF6B2C] mb-2">Similar questions already exist:</p>
                {duplicates.map(d => (
                  <a
                    key={d.slug}
                    href={`/q/${d.slug}`}
                    className="block text-xs text-[#8A94B0] hover:text-[#E8ECF8] py-0.5 truncate"
                    target="_blank" rel="noopener noreferrer"
                  >
                    → {d.title}
                  </a>
                ))}
              </div>
            )}

            <Button
              onClick={() => setStep(2)}
              disabled={!titleValid}
              className="w-full bg-[#FF6B2C] hover:bg-[#FF8A52] text-white font-semibold disabled:opacity-40"
            >
              Next: Add Context
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#E8ECF8] text-sm">Context (optional)</Label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="What's the absurdity here? Why does this need answering? Context helps engineers."
                rows={5}
                maxLength={4000}
                className="w-full bg-[#0A0E1A] border border-[#1E2740] rounded-lg px-3 py-2 text-sm text-[#E8ECF8] placeholder:text-[#8A94B0] resize-y focus:outline-none focus:border-[#FF6B2C]"
              />
              <p className="text-xs text-[#8A94B0] text-right">{body.length}/4000</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[#E8ECF8] text-sm">Tags (comma-separated, up to 5)</Label>
              <Input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="physics, food, engineering"
                className="bg-[#0A0E1A] border-[#1E2740] text-[#E8ECF8] placeholder:text-[#8A94B0]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-[#1E2740] text-[#8A94B0] hover:text-[#E8ECF8] hover:border-[#8A94B0] rounded-lg py-2 text-sm transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[#FF6B2C] hover:bg-[#FF8A52] text-white font-semibold rounded-lg py-2 text-sm transition-colors"
              >
                Next: Set Orbit
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#E8ECF8] text-sm">How absurd is this question?</Label>
              <p className="text-xs text-[#8A94B0]">
                Orbit will be recalibrated automatically once 5 crew members vote.
              </p>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {ORBITS.map(o => {
                  const meta = ORBIT_META[o]
                  const active = orbit === o
                  return (
                    <button
                      key={o}
                      onClick={() => setOrbit(o)}
                      className="flex items-center gap-3 p-3 rounded-lg border transition-all text-left"
                      style={{
                        borderColor: active ? meta.color : '#1E2740',
                        backgroundColor: active ? `${meta.color}10` : 'transparent',
                      }}
                    >
                      <span
                        className="text-xs font-mono font-bold shrink-0"
                        style={{ color: meta.color }}
                      >
                        {o.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm text-[#8A94B0]">{meta.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-[#0A0E1A] rounded-lg p-4 border border-[#1E2740]">
              <p className="text-xs text-[#8A94B0] mb-1">Preview</p>
              <p className="text-[#E8ECF8] font-medium text-sm">{title}</p>
            </div>

            {submitError && <p className="text-[#FF5470] text-sm">{submitError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-[#1E2740] text-[#8A94B0] hover:text-[#E8ECF8] rounded-lg py-2 text-sm transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-[#FF6B2C] hover:bg-[#FF8A52] text-white font-semibold rounded-lg py-2 text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? 'Launching…' : '🚀 Launch'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
