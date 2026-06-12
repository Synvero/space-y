/**
 * Seed script for SPACE Y? demo data.
 * Run with: npx tsx supabase/seed.ts
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Idempotent: delete existing seed data first
async function cleanup() {
  console.log('Cleaning up existing seed data...')
  const seedEmails = [
    'founder_gero@spacey.demo',
    'lunar_lena@spacey.demo',
    'doc_orbit@spacey.demo',
    'captain_kessler@spacey.demo',
    'mara_perigee@spacey.demo',
    'why_not_wanda@spacey.demo',
  ]
  // Content tables reference profiles WITHOUT on-delete-cascade, so a user cannot be
  // deleted while their authored rows still exist (the delete fails with a 500). Clear
  // all content first (child → parent order), then the users cascade-delete cleanly.
  const contentTables = ['votes', 'stakes', 'pledges', 'comments', 'reports', 'fuel_ledger', 'missions', 'markets', 'questions']
  for (const t of contentTables) {
    const { error } = await supabase.from(t).delete().gt('created_at', '1970-01-01T00:00:00Z')
    if (error) throw error
  }
  const { data: users } = await supabase.auth.admin.listUsers()
  for (const user of users?.users ?? []) {
    if (user.email && seedEmails.includes(user.email)) {
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) throw error
    }
  }
}

async function createProfile(email: string, handle: string, displayName: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })
  if (error) throw error
  const userId = data.user!.id

  // The trigger creates the profile automatically, but with email-derived handle
  // Update to our desired handle + display_name
  await supabase
    .from('profiles')
    .update({ handle, display_name: displayName })
    .eq('id', userId)

  // Give extra fuel for realistic seed state
  await supabase.from('fuel_ledger').insert({
    user_id: userId,
    delta: 500,
    reason: 'admin_adjust',
  })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return profile!
}

async function run() {
  await cleanup()

  console.log('Creating profiles...')
  const gero = await createProfile('founder_gero@spacey.demo', 'founder_gero', 'Gero')
  const lena = await createProfile('lunar_lena@spacey.demo', 'lunar_lena', 'Lunar Lena')
  const doc = await createProfile('doc_orbit@spacey.demo', 'doc_orbit', 'Doc Orbit')
  const kessler = await createProfile('captain_kessler@spacey.demo', 'captain_kessler', 'Capt. Kessler')
  const mara = await createProfile('mara_perigee@spacey.demo', 'mara_perigee', 'Mara Perigee')
  const wanda = await createProfile('why_not_wanda@spacey.demo', 'why_not_wanda', 'Why Not Wanda')

  const profiles = [gero, lena, doc, kessler, mara, wanda]

  console.log('Creating questions & missions...')

  // Helper: insert question + auto-created market
  async function insertQuestion(data: {
    author: typeof gero
    slug: string
    title: string
    body: string
    orbit: string
    tags: string[]
  }) {
    const { data: q, error } = await supabase
      .from('questions')
      .insert({
        author_id: data.author.id,
        slug: data.slug,
        title: data.title,
        body: data.body,
        orbit: data.orbit,
        tags: data.tags,
      })
      .select()
      .single()
    if (error) throw error
    return q!
  }

  async function insertMission(data: {
    question_id: string
    author: typeof gero
    title: string
    body: string
  }) {
    const { data: m, error } = await supabase
      .from('missions')
      .insert({
        question_id: data.question_id,
        author_id: data.author.id,
        title: data.title,
        body: data.body,
      })
      .select()
      .single()
    if (error) throw error
    return m!
  }

  async function addVotes(targetType: 'question' | 'mission', targetId: string, dimension: 'absurdity' | 'rigor', values: number[], voters: typeof profiles) {
    // The prevent_self_vote trigger rejects an author voting on their own target.
    // Exclude the author and backfill from the other profiles, so every call lands
    // exactly values.length votes (otherwise questions silently end up under-voted).
    const table = targetType === 'question' ? 'questions' : 'missions'
    const { data: tgt } = await supabase.from(table).select('author_id').eq('id', targetId).single()
    const authorId = (tgt as { author_id?: string } | null)?.author_id
    const ordered = [...voters, ...profiles.filter(p => !voters.some(v => v.id === p.id))]
    const eligible = ordered.filter(p => p.id !== authorId)
    for (let i = 0; i < values.length && i < eligible.length; i++) {
      const { error } = await supabase.from('votes').insert({
        user_id: eligible[i].id,
        target_type: targetType,
        target_id: targetId,
        dimension,
        value: values[i],
      })
      if (error) throw error
    }
  }

  // 1. Screaming Pot — LANDED
  const q1 = await insertQuestion({
    author: gero,
    slug: 'why-dont-plants-scream-when-theyre-thirsty',
    title: "Why don't plants scream when they're thirsty?",
    body: "We have moisture sensors. We have speakers. We have AI. And yet our houseplants silently die, radiating only accusatory brown edges. This needs fixing.",
    orbit: 'moon',
    tags: ['plants', 'hardware', 'iot'],
  })
  const m1 = await insertMission({
    question_id: q1.id,
    author: lena,
    title: 'The Screaming Pot',
    body: `## The Screaming Pot

A self-contained ESP32-based plant pot that monitors soil moisture and screams when thirsty.

### Bill of Materials (~€18)

| Part | Cost |
|------|------|
| ESP32-C3 mini | €4.50 |
| Capacitive soil moisture sensor | €2.00 |
| 3W mini speaker | €3.00 |
| 3D-printed housing (PLA, 80g) | €2.40 |
| LiPo 1000mAh + TP4056 charger | €4.20 |
| Misc (wires, hot glue) | €1.90 |

### How it works

1. The capacitive sensor reads soil moisture every 60 seconds.
2. When moisture drops below 20%, the ESP32 plays a distress audio clip (WAV stored in flash).
3. Three severity levels: gentle whimper (25%), plaintive cry (20%), full scream (15%).
4. Above 60% moisture: plays a satisfied sigh. Because feedback loops matter.

### Assembly

1. Print the housing (STL on GitHub link above).
2. Solder sensor leads to GPIO4 (signal) and GPIO5 (power — power-cycle to reduce corrosion).
3. Solder speaker to GPIO8 via 3.3V-compatible PWM amplifier (PAM8302).
4. Flash firmware via Arduino IDE, set threshold percentages in config.h.
5. Calibrate in dry soil (record as 0%) and fully saturated soil (100%).

### Evidence

The prototype ran 47 days on 1000mAh. Peak scream level: 78dB at 10cm. The neighbors noticed.

**Proof:** [Video of prototype in action — link to demo reel]`,
  })

  // Add votes (5+ for scoring to kick in, skip author voting on own)
  await addVotes('question', q1.id, 'absurdity', [6, 7, 5, 6, 8], [doc, kessler, mara, wanda, gero])
  await addVotes('mission', m1.id, 'rigor', [8, 9, 7, 8, 9], [gero, doc, kessler, mara, wanda])

  // Mark as landed (seed context bypasses the auth-gated verify_landing RPC).
  // Compute the same ×3 score verify_landing would produce, from the live aggregates,
  // so the flagship landing shows a real tripled score instead of a hardcoded value.
  const { data: q1agg } = await supabase.from('questions').select('absurdity').eq('id', q1.id).single()
  const { data: m1agg } = await supabase.from('missions').select('rigor').eq('id', m1.id).single()
  const landedScore = Math.round(
    ((q1agg as { absurdity: number | null } | null)?.absurdity ?? 0) *
    ((m1agg as { rigor: number | null } | null)?.rigor ?? 0) * 3
  )
  await supabase.from('missions').update({
    status: 'landed',
    landed_at: new Date().toISOString(),
    proof_url: 'https://example.com/screaming-pot-demo',
    proof_note: 'Verified: working prototype demonstrated in video.',
    score: landedScore,
  }).eq('id', m1.id)
  await supabase.from('questions').update({ status: 'landed' }).eq('id', q1.id)

  // Resolve market YES
  const { data: market1 } = await supabase.from('markets').select('id').eq('question_id', q1.id).single()
  if (market1) {
    await supabase.from('markets').update({
      status: 'resolved',
      outcome: true,
      resolved_at: new Date().toISOString(),
    }).eq('id', market1.id)
  }

  // 2. Drill 13 minutes
  const q2 = await insertQuestion({
    author: kessler,
    slug: 'why-does-every-household-own-a-drill-that-runs-13-minutes',
    title: "Why does every household own a drill that runs 13 minutes in its lifetime?",
    body: "The average household drill is used for a cumulative 13 minutes before being retired to the back of a drawer. Meanwhile, every neighbor within 200 meters owns one too.",
    orbit: 'geo',
    tags: ['sharing-economy', 'tools', 'community'],
  })
  const m2 = await insertMission({
    question_id: q2.id,
    author: mara,
    title: 'Street-Level Tool Library with Deposit System',
    body: `## Neighborhood Tool Collective

A building-block-level tool sharing network running on the deposit model used by German bottle returns.

### Core Concept

1. Each participating building appoints a **Werkzeug-Wart** (tool guardian) — typically someone already hoarding too many tools.
2. Tools are registered in a shared spreadsheet (or a Matrix/Signal group for tech-forward streets).
3. Borrowing: leave a €10–50 deposit matching tool value, get the tool, return within 48h, deposit returned.
4. No app needed. No liability beyond the deposit.

### Why the deposit model works

- The Pfand system has been proven at scale in Germany for 40 years.
- Zero-overhead for the guardian: just accept/return deposits and tools.
- Self-regulating: borrowers return tools because money is at stake.

### Rollout plan

1. Hang a laminated "Werkzeug-Bibliothek" sign in the building entrance.
2. Start with 5–10 tools. Drill, saw, level, tile cutter, wallpaper steamer.
3. Expand based on demand. Add Vereinsmodell (registered club) only if > 20 participants want formal structure.

### Evidence base

Real-world precedents: Leila (Berlin), Pumpipumpe (Switzerland), Tool Library Edinburgh. All prove the model scales to 100+ members with zero full-time staff.`,
  })
  await addVotes('question', q2.id, 'absurdity', [4, 5, 3, 4, 6], [gero, lena, doc, wanda, mara])
  await addVotes('mission', m2.id, 'rigor', [7, 8, 6, 7, 8], [gero, kessler, doc, lena, wanda])

  // Pledges on q2's mission
  await supabase.from('pledges').insert([
    { target_type: 'mission', target_id: m2.id, user_id: gero.id, amount_eur: 25, message: 'This should exist in every Kiez.' },
    { target_type: 'mission', target_id: m2.id, user_id: doc.id, amount_eur: 50, message: 'Ready to set it up in my building.' },
  ])

  // 3. Toast
  const q3 = await insertQuestion({
    author: doc,
    slug: 'why-does-toast-land-butter-side-down',
    title: "Why does toast land butter-side down?",
    body: "Every physicist, every comedian, and every toast-related insurance claim points to the same conclusion: butter faces gravity with an enthusiasm it shows nowhere else.",
    orbit: 'leo',
    tags: ['physics', 'food', 'science'],
  })
  const m3 = await insertMission({
    question_id: q3.id,
    author: wanda,
    title: 'Physics-Based Analysis + Two Countermeasures',
    body: `## The Buttered Toast Problem: A Rigorous Analysis

This is not Murphy's Law. It's Newton's.

### Why it really happens

1. **Table height**: Most tables are 72–76 cm high. Standard toast is ~12 cm × 12 cm, weighing ~30g.
2. **Rotation mechanics**: Toast pushed off a table edge starts rotating. The initial contact point at the edge applies a torque.
3. **Time to floor**: From 74 cm, fall time ≈ 0.39 seconds. At a typical push angular velocity of ~1.5 rad/s, this produces ~216° of rotation — just enough to invert from butter-up to butter-down.
4. **At 120 cm height** (bar height), rotation reaches ~300° — landing butter-side up. Hence café bars have statistically better toast luck.

### Countermeasures

**Option A: Raise the table**
To 120+ cm. Rotation reaches 300°, toast lands butter-up. Side effect: standing breakfast.

**Option B: Butter the bottom side**
Buttered side down at start of fall → lands butter-up. Requires psychological reprogramming.

**Option C: Tablecloth edge friction**
Increases angular velocity, overshoots 360°, butter-up landing. Test: velvet tablecloth, standard table, 94% butter-up in 50 trials (p<0.01).

### Reference
Matthews (1995), "Tumbling toast, Murphy's Law and the fundamental constants", European Journal of Physics.`,
  })
  await addVotes('question', q3.id, 'absurdity', [2, 3, 1, 2, 4], [gero, lena, kessler, mara, doc])
  await addVotes('mission', m3.id, 'rigor', [9, 8, 9, 7, 8], [gero, kessler, mara, lena, doc])

  // 4. Bus stops
  const q4 = await insertQuestion({
    author: lena,
    slug: 'why-are-bus-stops-the-most-boring-places-on-earth',
    title: "Why are bus stops the most boring places on Earth?",
    body: "We spend collective centuries waiting at bus stops. A plastic bench, a timetable in 8pt font, and the lingering philosophy of missed connections.",
    orbit: 'geo',
    tags: ['urban', 'design', 'transport'],
  })
  const m4 = await insertMission({
    question_id: q4.id,
    author: kessler,
    title: 'Swing-Bench Retrofit Kit',
    body: `## Bus Stop Swing-Bench Retrofit

Replace static bus benches with swinging benches. Sounds trivial. Has documented social effects.

### The Intervention

A swinging bench frame (powder-coated steel, 180kg load) replaces or supplements the standard shelter bench. The swing arc is constrained to 30° to remain ADA-compatible. Install time: 45 minutes per stop.

### Evidence from Real Deployments

- **Copenhagen**: 12 bus stops equipped with kinetic furniture in 2019. Reported wait satisfaction +38%. Graffiti incidents down 62% vs control group.
- **Vilnius, Lithuania**: "Happy Bench" project at 8 high-traffic stops. Instagram presence organic, 40k impressions in week 1.
- **Sheffield, UK**: 2022 Levelling Up pilot — 6 stops with interactive elements. Public consultation rated swing benches highest.

### Implementation

1. Source: Multiple EU municipal furniture suppliers stock ISO 9001-certified swing frames (~€400/unit).
2. Ground anchoring: standard M16 anchor bolts, identical to existing benches.
3. Maintenance: annual inspection, grease moving parts. Same schedule as standard infrastructure.

This is a solved problem. The only obstacle is procurement habit.`,
  })
  await addVotes('question', q4.id, 'absurdity', [4, 3, 5, 4, 3], [gero, doc, wanda, mara, lena])
  await addVotes('mission', m4.id, 'rigor', [8, 7, 8, 9, 7], [gero, lena, doc, wanda, mara])

  // 5. Message outliving the Sun
  const q5 = await insertQuestion({
    author: wanda,
    slug: 'why-cant-i-send-a-message-that-outlives-the-sun',
    title: "Why can't I send a message that outlives the Sun?",
    body: "The Sun has approximately 5 billion years left. Email retention policies are typically 7 years. This asymmetry seems like a design flaw.",
    orbit: 'deep_space',
    tags: ['archival', 'civilization', 'space', 'longevity'],
  })
  const m5 = await insertMission({
    question_id: q5.id,
    author: doc,
    title: '5D Quartz Glass Archive in Solar Orbit',
    body: `## The Eternal Message: 5D Quartz + Solar Orbit

### Step 1: Encode the message

**5D optical storage** (nanostructured quartz glass, technique developed at Southampton University) stores 360TB/disc with 13.8 billion year theoretical stability. Current cost: ~€5,000/disc for custom encoding. Declining curve mirrors early optical media.

### Step 2: Physical durability

Quartz glass survives:
- Temperatures up to 1,000°C (the disc survives after the Sun goes red giant, if retrieved)
- Cosmic radiation (glass matrix self-heals at room temperature)
- 10 billion year read-lifetime (tested via accelerated aging)

### Step 3: Delivery system

**Option A**: Deposit at lunar south pole permanently shadowed crater. Temperature: -250°C. Already proposed for lunar library projects (Arch Mission Foundation).

**Option B**: Heliocentric orbit at L4/L5 Lagrange points. Gravitationally stable for billions of years. Launch cost on a rideshare manifest: ~€15,000 for 1kg.

### Step 4: How to read it in 5 billion years

Include a Rosetta-format legend (binary counting, prime sequences, SI units) etched directly into the quartz. Same approach as Voyager Golden Record, now with 360TB instead of a vinyl disc.

### Cost today

Full stack: encoding (€5k) + launch (€15k) + Arch Mission partnership for legal/coordination (€0 — they want to send things). **~€20,000 for a message that genuinely outlasts the solar system.**`,
  })
  await addVotes('question', q5.id, 'absurdity', [9, 8, 9, 10, 8], [gero, lena, kessler, mara, wanda])
  await addVotes('mission', m5.id, 'rigor', [8, 7, 9, 8, 7], [gero, lena, kessler, mara, wanda])

  // 6. Clapping on planes
  const q6 = await insertQuestion({
    author: mara,
    slug: 'why-do-we-clap-when-planes-land',
    title: "Why do we clap when planes land?",
    body: "A Boeing 737 successfully not crashing provokes applause. The same thing happens 45,000 times per day. We never clap when buses park.",
    orbit: 'leo',
    tags: ['sociology', 'aviation', 'behavior'],
  })
  const m6 = await insertMission({
    question_id: q6.id,
    author: gero,
    title: 'Collective Tension Release + Experiment Design',
    body: `## The Sociology of Landing Applause

### What's actually happening

**Collective tension release** (CTR) — a well-documented social phenomenon where groups simultaneously discharge accumulated anxiety through coordinated action.

Three factors combine uniquely on aircraft:
1. **Shared vulnerability**: every passenger faces identical risk simultaneously. This creates group cohesion even among strangers.
2. **Helplessness**: passengers have zero control. Complete external locus of control amplifies anxiety.
3. **Abrupt resolution**: the landing is a sharp, unambiguous signal. "It's over." This triggers simultaneous CTR.

By contrast, bus parking: passengers can exit at any time, most arrived in-seat halfway, and the stop is not an abrupt event.

### Cross-cultural distribution

Applause on landing is significantly more common in:
- Eastern European flights (Czech Republic, Poland, Romania): ~70% of passengers report clapping
- Flights involving budget carriers with historically mixed safety perception
- First-time flyers (self-reported ~45% clap rate)

### Experiment design to test the CTR hypothesis

1. **Treatment**: add a captain announcement 2 minutes before landing: *"We are about to begin final approach. Relax, you're in good hands."* (anxiety reduction treatment)
2. **Control**: standard no-announcement condition
3. **Measure**: audio recording at landing, code clap duration + intensity
4. **Prediction**: reduced pre-landing anxiety → reduced CTR → less applause in treatment group

This is feasible with airline cooperation and a 100-flight sample. p < 0.05 is achievable.`,
  })
  await addVotes('question', q6.id, 'absurdity', [2, 1, 3, 2, 2], [lena, doc, kessler, wanda, mara])
  await addVotes('mission', m6.id, 'rigor', [9, 8, 9, 8, 9], [lena, doc, kessler, mara, wanda])

  // 7. Fridge
  const q7 = await insertQuestion({
    author: doc,
    slug: 'why-doesnt-my-fridge-know-what-inside-it',
    title: "Why doesn't my fridge know what's inside it?",
    body: "My phone knows where I've been for the last 12 years. My fridge doesn't know there's only one sad carrot in the vegetable drawer.",
    orbit: 'geo',
    tags: ['iot', 'food', 'privacy', 'vision'],
  })
  await insertMission({
    question_id: q7.id,
    author: lena,
    title: 'Retrofit Shelf Camera + Local Vision Model',
    body: `## FridgeEye: Privacy-Preserving Shelf Vision

### Architecture

1. **Camera**: Raspberry Pi Zero 2W + wide-angle CSI camera, mounted inside upper shelf lip. €18 hardware.
2. **Inference**: runs locally using a MobileNetV3 model fine-tuned on grocery categories (~120 items). Runs at 2 FPS, uses <200MB RAM.
3. **Inventory model**: tracks items by visual delta (item disappears/appears = remove/add event).
4. **Interface**: local web app only — no cloud, no external API calls.

### Privacy model

All processing on-device. The camera activates only when the door opens (magnetic reed switch). No video recording — only inference results stored. Image buffer: 3 seconds, then wiped. Compliant with GDPR Art. 5 data minimization principle.

### What it can't do

Distinguish between two nearly identical items (two cans of similar beans). Requires good lighting — mount a small LED strip if needed.

### What it can do

- Alert when milk is running low (95% accuracy on major brands)
- Detect opened/closed packaging (via contour change)
- Generate shopping list suggestions based on depletion patterns

**BOM total**: €28. Payback in avoided spoilage: €8–15/month for average German household.`,
  })
  await addVotes('question', q7.id, 'absurdity', [4, 3, 5, 3, 4], [gero, lena, kessler, mara, wanda])

  // 8. Michelin star for döner
  const q8 = await insertQuestion({
    author: kessler,
    slug: 'why-is-there-no-michelin-star-for-doner',
    title: "Why is there no Michelin star for döner?",
    body: "The Michelin Guide rates restaurants using anonymous inspectors and rigorous criteria. None of those criteria apparently apply to Berlin's most important cultural institution.",
    orbit: 'moon',
    tags: ['food', 'culture', 'berlin', 'standards'],
  })
  const m8 = await insertMission({
    question_id: q8.id,
    author: mara,
    title: 'Blind-Judging Protocol with Standardized Rubric',
    body: `## The Döner Excellence Standard (DES)

A systematic blind-judging protocol to evaluate döner at the same rigor applied to Michelin 3-star candidates.

### Judging Rubric (100 points total)

| Category | Points | Criteria |
|----------|--------|----------|
| Bread (Fladenbrot) | 20 | Fresh-baked vs. industrial, crust structure, interior crumb, temperature at service |
| Meat | 30 | Spice blend consistency, moisture retention, char distribution, internal temperature |
| Sauce balance | 25 | Yogurt acid level, garlic intensity, herb freshness, sauce-to-meat ratio |
| Vegetable freshness | 15 | Cabbage crunch, tomato ripeness, onion prep |
| Assembly integrity | 10 | Wrap holds structural integrity for 5 bites minimum |

### Blind tasting protocol

1. Two judges per session (to flag subjective drift).
2. Döner purchased by a third party (anonymizer), foil-wrapped, labeled only A/B/C.
3. Judges score each rubric independently, compare, reconcile.
4. Three visits minimum per establishment across different times of day and days of week.

### Pilot: Berlin Kreuzberg, 3 candidates

Ready to run. Need 2 co-judges willing to commit 6 Saturdays. Budget: €180 (all döner costs). Contact via profile.`,
  })
  await addVotes('question', q8.id, 'absurdity', [6, 7, 5, 6, 7], [gero, lena, doc, wanda, mara])
  await addVotes('mission', m8.id, 'rigor', [7, 8, 6, 7, 8], [gero, lena, doc, kessler, wanda])

  // Add stakes on q8 market
  const { data: market8 } = await supabase.from('markets').select('id').eq('question_id', q8.id).single()
  if (market8) {
    // Direct stake inserts (bypass RPC for seed)
    await supabase.from('fuel_ledger').insert([
      { user_id: gero.id, delta: -100, reason: 'stake', ref_id: market8.id },
      { user_id: lena.id, delta: -50, reason: 'stake', ref_id: market8.id },
      { user_id: doc.id, delta: -75, reason: 'stake', ref_id: market8.id },
    ])
    await supabase.from('stakes').insert([
      { market_id: market8.id, user_id: gero.id, side: true, amount: 100 },
      { market_id: market8.id, user_id: lena.id, side: false, amount: 50 },
      { market_id: market8.id, user_id: doc.id, side: true, amount: 75 },
    ])
  }

  // 9. Umbrellas vs spider webs
  const q9 = await insertQuestion({
    author: gero,
    slug: 'why-do-umbrellas-break-when-spider-webs-dont',
    title: "Why do umbrellas break when spider webs don't?",
    body: "Spider silk is pound-for-pound stronger than steel and survives the same storms that destroy €4 tourist umbrellas. Something has gone wrong in the supply chain of human engineering.",
    orbit: 'moon',
    tags: ['materials', 'biomimicry', 'engineering'],
  })
  await insertMission({
    question_id: q9.id,
    author: wanda,
    title: 'Biomimetic Radial Spokes with Elastic Joints',
    body: `## Spider-Web Umbrella: Biomimetic Spoke Design

### Why standard umbrellas fail

Current umbrella spokes are rigid steel or fiberglass rods in a radial array. When wind loads exceed design parameters (typically >60 km/h), the central hub sees concentrated stress — it inverts or the spoke root fails.

Spider orb webs survive similar loads because:
1. **Radial threads** are stiff (for load transmission)
2. **Spiral threads** are elastic (for energy absorption)
3. **Joints** at intersections can slip before failing

### Proposed design

Replace rigid spoke array with a two-material system:
- **Radial spokes**: standard fiberglass (stiff, for canopy support)
- **Spiral secondary supports**: TPU (thermoplastic polyurethane) rings connecting spoke midpoints, high elasticity

Wind loading tests on prototype (Diploma thesis, TU Dresden, 2022) showed:
- Standard umbrella: inversion failure at 58 km/h
- Biomimetic version: survived 90 km/h without inversion (test ceiling)
- Weight increase: 18%
- Cost increase: €1.20 per umbrella at scale

### Material comparison

| Material | Tensile strength | Elongation at break |
|---------|-----------------|-------------------|
| Spider dragline silk | 1.1 GPa | 40% |
| TPU (Elastollan) | 0.05 GPa | 600% |
| Steel wire (spokes) | 2.0 GPa | 2% |

TPU can't match silk's strength-to-weight, but at umbrella scales, elongation matters more than tensile strength.`,
  })
  await addVotes('question', q9.id, 'absurdity', [5, 6, 5, 7, 5], [lena, doc, kessler, mara, wanda])

  // 10. Office quiet carriage
  const q10 = await insertQuestion({
    author: lena,
    slug: 'why-is-there-no-quiet-carriage-for-open-plan-offices',
    title: "Why is there no quiet carriage for open-plan offices?",
    body: "Trains have quiet carriages. Libraries have quiet zones. Open-plan offices — where actual knowledge work happens — have Chad from Sales on a speakerphone and a foosball table.",
    orbit: 'geo',
    tags: ['workplace', 'productivity', 'design'],
  })
  await insertMission({
    question_id: q10.id,
    author: kessler,
    title: 'Silence Pod Protocol Without Buying Furniture',
    body: `## The Quiet Zone Protocol (No Furniture Purchase Required)

### The core insight

Pod furniture costs €8,000–15,000. This protocol achieves 80% of the benefit for €0 in capital cost.

### Implementation

**Step 1: Designate 2–3 desks as "Quiet Zone" desks**
Any desk near a window, corner, or low-traffic area. Mark with a small tent card.

**Step 2: Three-state Ampel system**
- 🟢 Green: quiet zone active, take any open seat
- 🟡 Yellow: quiet zone filling up, check demand
- 🔴 Red: full, wait or use another zone

Use a shared Google Calendar event named "QUIET ZONE [DATE]" for digital signaling. Physical: use a LED traffic light from Amazon (€15, plug-in, no wiring) with a manual remote.

**Step 3: Book in 2-hour blocks**
Via an existing calendar tool (Outlook, Google, Calendly). No new software.

**Step 4: The two rules, written on a laminated card**
1. No voice calls in the quiet zone.
2. Headphones required if listening to audio.

### Why this works

Enforcement doesn't come from managers — it comes from the booking system creating psychological permission to shush someone. "I booked this block" is a legitimate reason to enforce.

**Pilot template**: available as a Google Doc. Start Monday.`,
  })
  await addVotes('question', q10.id, 'absurdity', [3, 4, 3, 5, 3], [gero, doc, kessler, mara, lena])

  // 11. Germany fax
  const q11 = await insertQuestion({
    author: wanda,
    slug: 'why-does-germany-still-fax-things',
    title: "Why does Germany still fax things?",
    body: "Germany is the world's 4th largest economy. It sends more faxes than any other EU country. In 2024, the German tax authority received 3 million faxes. These are not inconsistent facts.",
    orbit: 'mars',
    tags: ['bureaucracy', 'germany', 'tech-debt', 'satire'],
  })
  await insertMission({
    question_id: q11.id,
    author: doc,
    title: 'Fax-to-Email Bridge as Behörden Sidecar',
    body: `## The Bundesfax Bridge

A minimally invasive fax-to-email (and email-to-fax) gateway that works alongside existing fax infrastructure without replacing it.

### Why replacement fails

Germany faxes because:
1. Fax has legal standing as a signed document under German law (more complex than email)
2. IT procurement cycles in Behörden: 7–12 years
3. "Wenn's funktioniert, repariere es nicht" at institutional scale

### Why a bridge succeeds

A bridge doesn't require the institution to change. It converts transparently.

### Technical architecture

1. **Hardware**: Fritz!Box ATA (analog telephone adapter), €80. Plug into existing fax number.
2. **Software**: Hylafax (open source fax server) + Python email bridge, Docker-deployed.
3. **Inbound**: Fax received → rendered as PDF → forwarded to designated email address.
4. **Outbound**: Send email with PDF attachment to fax@your-domain.de → transmitted as fax to recipient number in subject line.

### Legal note (German-specific)

For legally binding signed documents: the PDF must be treated as an archive copy, not a substitute. Original fax confirmations (Sendebericht) should be retained if legal challenges are anticipated. This is a known gap — mark this as a "technical satire with working plumbing."

**Deployment cost**: €80 hardware + €5/month server. Setup: 2 hours for anyone comfortable with Docker.`,
  })
  await addVotes('question', q11.id, 'absurdity', [7, 8, 8, 7, 9], [gero, lena, kessler, mara, doc])

  // 12. Vending machine for sunsets
  const q12 = await insertQuestion({
    author: mara,
    slug: 'why-has-nobody-built-a-vending-machine-for-sunsets',
    title: "Why has nobody built a vending machine for sunsets?",
    body: "Natural sunsets require weather cooperation, a clear horizon, and not being in a meeting at 6 PM. This is too many dependencies for something so necessary.",
    orbit: 'deep_space',
    tags: ['light', 'wellbeing', 'installation', 'art'],
  })
  await insertMission({
    question_id: q12.id,
    author: gero,
    title: 'Golden-Hour Projection Room with Light Therapy',
    body: `## The Sunset Dispensary

An installation space that delivers a pharmacologically effective sunset-equivalent on demand, using calibrated light projection and optional aromatics.

### The science of sunset benefit

Natural sunsets provide measurable benefits through:
1. **Circadian timing**: orange-spectrum light at 1,800–2,500K triggers melatonin onset timing via ipRGC cells (Czeisler, 2013)
2. **Psychological deceleration**: the 23-minute average duration of golden hour matches the typical stress-hormone half-life (cortisol: 60–90 min, but perceptual shift occurs in 20–30 min)
3. **Social context effect**: sunsets are 40% more satisfying when witnessed with others (Jamieson et al., 2021, Journal of Environmental Psychology)

### Installation spec

- **Room**: 4m × 6m, ceiling height 3m minimum, white walls and ceiling
- **Projection**: 3× Christie DWU1075-GS (6,000 ANSI lumens, no lamp replacement needed for 20,000h) covering all four walls + ceiling
- **Content**: 4K timelapse of 8 real sunsets from different latitudes (shot specifically, licensed for installation)
- **Color calibration**: matched to CIE standard illuminant D65 shifted to 2200K over 23-minute sequence
- **Aromatics (optional)**: atomized bergamot + cedar at 0.5 ppm — within safe inhalation limits (IFRA standard)

### Format options

- Museum permanent installation: €80,000 equipment, €15,000 content, €5,000 AV integration
- Container pop-up (transportable, self-contained): €45,000 total
- Corporate wellness contract: €2,400/month, includes 2 maintenance visits

**This is a fundable art-science project.** Light therapy efficacy is peer-reviewed. The installation aesthetic earns the gallery wall.`,
  })
  await addVotes('question', q12.id, 'absurdity', [9, 8, 9, 8, 9], [lena, doc, kessler, wanda, gero])

  // Add some comments
  console.log('Adding comments...')
  const commentData = [
    { q: q1, author: doc, body: "This is incredible. The 3-level scream severity is *chef's kiss*." },
    { q: q1, author: kessler, body: "Already building one. Started last Tuesday." },
    { q: q2, author: gero, body: "My building super asked me to stop leaving notes about this. I have not stopped leaving notes about this." },
    { q: q3, author: wanda, body: "The velvet tablecloth data is the most important contribution to physics in the 21st century." },
    { q: q5, author: lena, body: "The Arch Mission Foundation already launched data to the ISS. This is closer to reality than it sounds." },
    { q: q8, author: gero, body: "I will fund the pilot. I live 200m from three candidates." },
    { q: q11, author: mara, body: "I called my Finanzamt to ask if they accepted email. They put me on hold for 25 minutes then faxed me the answer." },
    { q: q12, author: wanda, body: "The cortisol half-life note is doing a lot of heavy lifting here but I respect the commitment to scientific framing." },
  ]

  for (const c of commentData) {
    await supabase.from('comments').insert({
      target_type: 'question',
      target_id: c.q.id,
      author_id: c.author.id,
      body: c.body,
    })
  }

  // Make gero admin for testing
  await supabase.from('profiles').update({ role: 'admin' }).eq('id', gero.id)

  console.log('Seed complete!')
  console.log('Admin user: founder_gero@spacey.demo (use magic link to log in)')
  console.log('Profiles created:', profiles.map(p => p.handle).join(', '))
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
