import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Heart,
  HelpCircle,
  RotateCcw,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react'

const ROUND_TARGET = 1000
const ANNUAL_TARGET = 4000

const quizQuestions = [
  { question: 'Why are triploid watermelons seedless?', answer: 'B) 3n chromosomes', options: ['A) GMOs', 'B) 3n chromosomes', 'C) Dark growth'] },
  { question: 'What is the primary benefit of "Pelleted" seeds?', answer: 'B) Easier planting', options: ['A) Faster growth', 'B) Easier planting', 'C) Pest resistance'] },
  { question: 'Which part of the plant becomes the "Seed"?', answer: 'A) Ovule', options: ['A) Ovule', 'B) Stigma', 'C) Pollen'] },
  { question: 'What is "Vernalization"?', answer: 'B) Cold treatment', options: ['A) Sun exposure', 'B) Cold treatment', 'C) Water absorption'] },
]

function randomQuizQuestion() {
  return quizQuestions[Math.floor(Math.random() * quizQuestions.length)]
}

const customerProfiles = [
  { id: 'bistro', name: 'Bamboo Bistro', panda: 'Chef Bao', icon: '👨‍🍳🐼' },
  { id: 'mart', name: 'GroveMart', panda: 'Buyer Mei', icon: '🛒🐼' },
  { id: 'zoo', name: 'Jade Export', panda: 'Trader Tao', icon: '🚢📦🐼' },
]

// Each event carries a FIXED probability the player cannot adjust. The only
// decision left to the player is how to classify and report it.
const rounds = [
  {
    name: 'Spring',
    emoji: '🌱',
    note: 'Read the probability, pick the right bucket.',
    customers: [
      { id: 'bistro', type: 'Risk', probability: 96, impactFactor: 0.15, vague: 'Chef Bao just found out the venue crew might cancel the spring banquet booking. He is not smiling.' },
      { id: 'mart', type: 'Risk', probability: 82, impactFactor: 0.15, vague: 'Buyer Mei says procurement is reviewing order volumes after a slow month. Nothing decided yet.' },
      { id: 'zoo', type: 'Opportunity', probability: 55, impactFactor: 0.3, vague: 'Trader Tao mentions a shipping window might open extra capacity, but nothing is booked.' },
    ],
  },
  {
    name: 'Summer',
    emoji: '🔥',
    note: 'Watch the trap — a rumor is not automatically safe to ignore.',
    customers: [
      { id: 'bistro', type: 'Risk', probability: 60, impactFactor: 0.35, vague: "There's a rumor the kitchen might renovate mid-season. Chef Bao shrugs — \"who knows.\"" },
      { id: 'mart', type: 'Risk', probability: 98, impactFactor: 0.15, vague: "Buyer Mei just forwarded the actual pullback notice from her regional office. It's already signed." },
      { id: 'zoo', type: 'Risk', probability: 80, impactFactor: 0.15, vague: 'Trader Tao heard port congestion is likely this month, though customs has not confirmed anything.' },
    ],
  },
  {
    name: 'Fall',
    emoji: '🍂',
    note: "A high-probability Opportunity still isn't a Rolling Forecast.",
    customers: [
      { id: 'bistro', type: 'Opportunity', probability: 92, impactFactor: 0.58, vague: 'Chef Bao is basically ready to lock in a harvest tasting menu — just needs final confirmation.' },
      { id: 'mart', type: 'Risk', probability: 70, impactFactor: 0.35, vague: 'There is early chatter about margin pressure at GroveMart, but nobody official has said anything.' },
      { id: 'zoo', type: 'Risk', probability: 95, impactFactor: 0.15, vague: 'Trader Tao just got the official customs notice: clearance is delayed. It is stamped and dated.' },
    ],
  },
  {
    name: 'Winter',
    emoji: '❄️',
    note: 'Full mix. Apply the rule under pressure.',
    customers: [
      { id: 'bistro', type: 'Risk', probability: 100, impactFactor: 0.15, vague: 'Chef Bao forwards a written cancellation for the holiday banquet. It is final.' },
      { id: 'mart', type: 'Opportunity', probability: 78, impactFactor: 0.62, vague: 'Buyer Mei says the holiday endcap is likely to get approved this week.' },
      { id: 'zoo', type: 'Risk', probability: 77, impactFactor: 0.15, vague: "Trader Tao says a winter storm could delay shipping, but the meteorologist isn't confident." },
    ],
  },
]

const DECISION_LABEL = {
  rolling: 'Rolling Forecast',
  ro: 'Risk & Opportunity',
  not_sig: 'Not Significant',
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function stalks(value) {
  return `${Math.round(value).toLocaleString()} stalks`
}

function signedStalks(value) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${Math.abs(Math.round(value)).toLocaleString()} stalks`
}

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Splits the round target across customers into an uneven, randomized
// allocation (e.g. 400/300/300 or 250/550/200) that always sums to the total.
function splitTarget(total, parts) {
  const weights = Array.from({ length: parts }, () => 0.6 + Math.random())
  const weightSum = weights.reduce((sum, w) => sum + w, 0)
  const rounded = weights.map((w) => Math.round(((w / weightSum) * total) / 10) * 10)
  const diff = total - rounded.reduce((sum, v) => sum + v, 0)
  rounded[0] += diff
  return shuffle(rounded)
}

// Whether an event actually happens is no longer a coin flip or an authored
// guess — it's driven directly by its probability. 75%+ happens, below that
// it doesn't. (This lines up with the same 75% line the reporting rule uses.)
function eventHappens(probability) {
  return probability >= 75
}

function makeRoundCustomers(roundIndex) {
  const round = rounds[roundIndex]
  const allocations = splitTarget(ROUND_TARGET, customerProfiles.length)
  return customerProfiles.map((profile, index) => {
    const script = round.customers.find((customer) => customer.id === profile.id)
    const target = allocations[index]
    const amount = Math.max(10, Math.round((target * script.impactFactor) / 10) * 10)
    return {
      ...profile,
      ...script,
      target,
      amount,
      happens: eventHappens(script.probability),
      visited: false,
      investigated: false,
      decision: null,
    }
  })
}

// The rule the whole game is built around:
//  - Anything below 75% (Risk or Opportunity) → Not Significant. Too uncertain to
//    report yet — work it harder until the real odds firm up one way or the other.
//  - A Risk at 95%+ → Rolling Forecast (the target allocation can't hold).
//  - Everything else (a Risk at 75-95%, or an Opportunity at 75%+) → Risk & Opportunity,
//    since an Opportunity never joins the committed baseline no matter how likely it is.
function correctClassification(type, probability) {
  if (probability < 75) return 'not_sig'
  if (type === 'Risk' && probability >= 95) return 'rolling'
  return 'ro'
}

function probabilityHint(probability) {
  if (probability >= 90) return 'Feels almost certain to management.'
  if (probability >= 75) return 'Feels fairly likely, but not locked in.'
  if (probability >= 50) return 'Genuinely unclear — could go either way.'
  return 'Feels like a long shot right now.'
}

function ruleExplanation(type, probability) {
  if (probability < 75) {
    return 'Too uncertain to report yet — work it harder until it\'s clearly a real signal or a non-issue.'
  }
  if (type === 'Risk' && probability >= 95) {
    return "95%+ risk is basically locked in — it has to become your committed number."
  }
  if (type === 'Opportunity') {
    return "Opportunities never planned in your original target, never report as rolling forecast."
  }
  return "Real risk, not a sure thing yet — flag it, don't commit it."
}

function severityDelta(severity) {
  return { good: 3, minor: -4, major: -10, critical: -18 }[severity] ?? 0
}

function evaluateDecision(customer) {
  const correctBucket = correctClassification(customer.type, customer.probability)
  const chosen = customer.decision || 'not_sig'
  const isCorrect = chosen === correctBucket
  let severity = 'good'
  if (!isCorrect) {
    if (correctBucket === 'rolling') severity = 'critical'
    else if (chosen === 'rolling') severity = 'major'
    else if (correctBucket === 'ro' && chosen === 'not_sig') severity = 'major'
    else severity = 'minor'
  }
  return { correctBucket, chosen, isCorrect, severity }
}

function committedForecastFor(customer) {
  if (customer.decision !== 'rolling') return customer.target
  return customer.type === 'Risk' ? customer.target - customer.amount : customer.target + customer.amount
}

function calculateFinalOutcome({ accuracy, trust }) {
  if (accuracy >= 90 && trust >= 85) {
    return {
      title: 'The Forecast Sage',
      emoji: '🧙‍♂️🎋🐼',
      tone: 'emerald',
      feedback: "You read every signal correctly and never let management get blindsided. This is what disciplined rolling-forecast reporting looks like.",
    }
  }
  if (accuracy >= 75 && trust >= 65) {
    return {
      title: 'The Reliable Reporter',
      emoji: '📊🐼',
      tone: 'emerald',
      feedback: 'Mostly sharp calls. A few signals slipped through the cracks, but management still trusts your numbers.',
    }
  }
  if (accuracy < 50 || trust < 40) {
    return {
      title: 'The Blindsided Broker',
      emoji: '🙈🐼',
      tone: 'red',
      feedback: "Too many signals were misclassified or missed entirely. Management kept getting surprised by numbers that didn't hold.",
    }
  }
  return {
    title: 'The Cautious Learner',
    emoji: '🌱🐼',
    tone: 'amber',
    feedback: "You're getting the idea, but the classification thresholds still trip you up under pressure. Keep practicing 95% / 75%.",
  }
}

export default function App() {
  const [roundIndex, setRoundIndex] = useState(0)
  const [customers, setCustomers] = useState(() => makeRoundCustomers(0))
  const [activeId, setActiveId] = useState(null)
  const [roundResult, setRoundResult] = useState(null)
  const [history, setHistory] = useState([])
  const [performance, setPerformance] = useState({ totalActual: 0, trust: 100, correctCount: 0, totalCount: 0 })
  const [reviewOpen, setReviewOpen] = useState(false)
  const [hearts, setHearts] = useState(0)
  const [managerPromptOpen, setManagerPromptOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizMessage, setQuizMessage] = useState('')
  const [currentQuiz, setCurrentQuiz] = useState(() => randomQuizQuestion())

  const round = rounds[roundIndex]
  const active = customers.find((customer) => customer.id === activeId)
  const decidedCount = customers.filter((customer) => customer.decision).length
  const canClose = decidedCount === customers.length && !roundResult

  const targetTotal = customers.reduce((sum, customer) => sum + customer.target, 0)
  const rollingTotal = customers.reduce((sum, customer) => sum + committedForecastFor(customer), 0)
  const roItems = customers.filter((customer) => customer.decision === 'ro')

  function visit(id) {
    setCustomers((current) => current.map((customer) => customer.id === id ? { ...customer, visited: true } : customer))
    setActiveId(id)
  }

  function investigate(id) {
    setCustomers((current) => current.map((customer) => customer.id === id ? { ...customer, investigated: true } : customer))
  }

  function report(id, decision) {
    setCustomers((current) => current.map((customer) => customer.id === id ? { ...customer, decision } : customer))
    setActiveId(null)
  }

  function useHeart(id) {
    if (hearts <= 0) return
    const target = customers.find((customer) => customer.id === id)
    if (!target || target.decision || target.type !== 'Risk') return
    setCustomers((current) => current.map((customer) => customer.id === id
      ? { ...customer, type: 'Opportunity', probability: Math.max(customer.probability, 70), hearted: true, vague: 'Heart repaired the relationship — this is now a potential Opportunity.' }
      : customer))
    setHearts((value) => value - 1)
  }

  function closeRound() {
    const resolved = customers.map((customer) => {
      const evaluation = evaluateDecision(customer)
      const actualDelta = customer.happens ? (customer.type === 'Risk' ? -customer.amount : customer.amount) : 0
      const actualResult = customer.target + actualDelta
      const committed = committedForecastFor(customer)
      return { ...customer, ...evaluation, actualDelta, actualResult, committed }
    })

    const trustDelta = resolved.reduce((sum, customer) => sum + severityDelta(customer.severity), 0)
    const correctCount = resolved.filter((customer) => customer.isCorrect).length
    const roundActual = resolved.reduce((sum, customer) => sum + customer.actualResult, 0)

    const nextPerformance = {
      totalActual: performance.totalActual + roundActual,
      trust: clamp(performance.trust + trustDelta, 0, 100),
      correctCount: performance.correctCount + correctCount,
      totalCount: performance.totalCount + resolved.length,
    }
    const snapshot = {
      round: round.name,
      emoji: round.emoji,
      targetTotal,
      rollingTotal,
      roundActual,
      trustDelta,
      customers: resolved,
    }

    setCustomers(resolved)
    setPerformance(nextPerformance)
    setHistory((current) => [...current, snapshot])
    setRoundResult(snapshot)
  }

  function continueAfterRound() {
    const missedTarget = roundResult && roundResult.roundActual < roundResult.targetTotal
    const isLastRound = roundIndex === rounds.length - 1
    setRoundResult(null)
    if (isLastRound) {
      setReviewOpen(true)
      return
    }
    const nextIndex = roundIndex + 1
    setRoundIndex(nextIndex)
    setCustomers(makeRoundCustomers(nextIndex))
    setActiveId(null)
    if (missedTarget) {
      setCurrentQuiz(randomQuizQuestion())
      setQuizMessage('')
      setManagerPromptOpen(true)
    }
  }

  function answerQuiz(answer) {
    if (answer === currentQuiz.answer) {
      setHearts((value) => value + 1)
      setQuizMessage('Correct! +1 Heart — use it to convert a Risk into an Opportunity.')
      window.setTimeout(() => {
        setQuizOpen(false)
        setQuizMessage('')
      }, 800)
    } else {
      setQuizMessage('Not quite — try again.')
    }
  }

  function resetGame() {
    setRoundIndex(0)
    setCustomers(makeRoundCustomers(0))
    setActiveId(null)
    setRoundResult(null)
    setHistory([])
    setPerformance({ totalActual: 0, trust: 100, correctCount: 0, totalCount: 0 })
    setReviewOpen(false)
    setHearts(0)
    setManagerPromptOpen(false)
    setQuizOpen(false)
    setQuizMessage('')
    setCurrentQuiz(randomQuizQuestion())
  }

  return (
    <main className="min-h-screen bg-white text-slate-950 botanical-bg">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <IntroStrip />

        <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-5">
            <TargetSection customers={customers} targetTotal={targetTotal} />
            <RollingForecastSection customers={customers} targetTotal={targetTotal} rollingTotal={rollingTotal} />

            <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-soft">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-400">Round {roundIndex + 1} of {rounds.length}</p>
                  <h2 className="mt-1 text-5xl font-black">{round.emoji} {round.name}</h2>
                  <p className="mt-1 max-w-3xl text-lg font-semibold text-slate-600">{round.note}</p>
                </div>
                <div className="flex items-center gap-3">
                  {hearts > 0 && <HeartMeter hearts={hearts} />}
                  <button onClick={closeRound} disabled={!canClose} className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white transition hover:bg-emerald-700 disabled:bg-slate-300">
                    Close Round
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {customers.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} hearts={hearts} onVisit={() => visit(customer.id)} />
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <Scoreboard performance={performance} history={history} />
            <RiskOpportunitySection roItems={roItems} />
          </aside>
        </section>
      </div>

      {active && (
        <VisitModal
          customer={active}
          hearts={hearts}
          onInvestigate={() => investigate(active.id)}
          onReport={(decision) => report(active.id, decision)}
          onHeart={() => useHeart(active.id)}
          onClose={() => setActiveId(null)}
        />
      )}
      {roundResult && <RoundResult result={roundResult} final={roundIndex === rounds.length - 1} onContinue={continueAfterRound} />}
      {managerPromptOpen && <ManagerPrompt onWorkHard={() => { setManagerPromptOpen(false); setQuizOpen(true) }} />}
      {quizOpen && <QuizModal quiz={currentQuiz} message={quizMessage} onAnswer={answerQuiz} />}
      {reviewOpen && <YearEndReview performance={performance} history={history} onReset={resetGame} />}
    </main>
  )
}

function IntroStrip() {
  return (
    <section className="rounded-[1.5rem] border border-emerald-100 bg-white/90 p-4 shadow-soft">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-lg font-black text-slate-950">🐼 Bamboo Ledger</span>
        <p className="text-sm font-semibold text-slate-600 sm:text-base">A rolling-forecast game — decide what to commit, flag, or leave unreported.</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-slate-600 sm:text-base">
        <span>1. Visit &amp; investigate</span>
        <span className="text-slate-300">→</span>
        <span>2. Classify the signal</span>
        <span className="text-slate-300">→</span>
        <span>3. Close the round</span>
        <span className="text-slate-300">→</span>
        <span>4. Learn from the reflection</span>
      </div>
    </section>
  )
}

function TargetSection({ customers, targetTotal }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Target size={22} />
          <h3 className="text-xl font-black text-slate-950">Target by Customer</h3>
        </div>
        <span className="rounded-2xl bg-slate-900 px-4 py-2 text-lg font-black text-white">Total {stalks(targetTotal)}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {customers.map((customer) => (
          <div key={customer.id} className="rounded-2xl bg-slate-50 p-4 shadow-sm">
            <p className="font-bold text-slate-600">{customer.icon} {customer.name}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{stalks(customer.target)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function RollingForecastSection({ customers, targetTotal, rollingTotal }) {
  const delta = rollingTotal - targetTotal
  return (
    <section className="rounded-[2rem] border border-emerald-200 bg-white/90 p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-emerald-800">
          <TrendingUp size={22} />
          <h3 className="text-xl font-black text-slate-950">Rolling Forecast</h3>
        </div>
        <span className={`rounded-2xl px-4 py-2 text-lg font-black text-white ${delta < 0 ? 'bg-red-500' : delta > 0 ? 'bg-emerald-600' : 'bg-slate-900'}`}>
          {stalks(rollingTotal)} ({delta === 0 ? 'on target' : signedStalks(delta)})
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {customers.map((customer) => {
          const committed = committedForecastFor(customer)
          const below = committed < customer.target
          const above = committed > customer.target
          return (
            <div key={customer.id} className="rounded-2xl bg-slate-50 p-4 shadow-sm">
              <p className={`font-bold ${below ? 'text-red-600' : 'text-slate-600'}`}>{customer.icon} {customer.name}</p>
              <p className={`mt-1 text-2xl font-black ${below ? 'text-red-600' : above ? 'text-emerald-700' : 'text-slate-900'}`}>{stalks(committed)}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function RiskOpportunitySection({ roItems }) {
  return (
    <section className="rounded-[2rem] border border-amber-200 bg-white/90 p-5 shadow-soft">
      <div className="flex items-center gap-2 text-amber-800">
        <AlertTriangle size={22} />
        <h3 className="text-xl font-black text-slate-950">Risk &amp; Opportunity</h3>
      </div>
      <div className="mt-4 space-y-3">
        {roItems.length === 0 && (
          <p className="rounded-2xl bg-amber-50 p-4 text-base font-bold text-slate-400">Nothing flagged yet.</p>
        )}
        {roItems.map((customer) => (
          <div key={customer.id} className="rounded-2xl bg-amber-50 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-700">{customer.icon} {customer.name}</span>
              <SignalBadge type={customer.type} />
            </div>
            <p className="mt-2 text-xl font-black text-slate-800">{customer.type === 'Opportunity' ? '+' : '-'}{stalks(customer.amount)} · {customer.probability}%</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CustomerCard({ customer, hearts, onVisit }) {
  const canUseHeart = hearts > 0 && customer.visited && customer.type === 'Risk' && !customer.decision
  return (
    <article className={`rounded-3xl border bg-white p-6 shadow-lg transition ${customer.visited ? 'border-emerald-200' : 'border-slate-100'} ${canUseHeart ? 'drop-heart-zone' : ''}`}>
      <p className="text-5xl">{customer.icon}</p>
      <h3 className="mt-2 text-2xl font-black">{customer.name}</h3>
      <p className="font-bold text-slate-500">{customer.panda}</p>
      <p className="mt-2 text-sm font-black uppercase tracking-wide text-slate-400">Target: {stalks(customer.target)}</p>
      {customer.visited && <div className="mt-3"><SignalBadge type={customer.type} /></div>}
      <p className="mt-3 min-h-20 font-semibold text-slate-600">{customer.visited ? customer.vague : 'Visit to reveal the signal.'}</p>
      {customer.hearted && <p className="mt-3 rounded-2xl bg-pink-100 p-3 font-black text-pink-900">💚 Heart converted this to an Opportunity.</p>}
      {customer.decision && (
        <div className="mt-3 rounded-2xl bg-emerald-50 p-3 font-black text-emerald-900">
          {DECISION_LABEL[customer.decision]}
        </div>
      )}
      {canUseHeart && <p className="mt-3 text-center text-sm font-black text-pink-700">💚 Heart available inside</p>}
      <button onClick={onVisit} disabled={Boolean(customer.decision)} className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white hover:bg-emerald-700 disabled:bg-slate-300">
        {customer.decision ? 'Decision Complete' : customer.visited ? 'Continue Visit' : 'Visit'}
      </button>
    </article>
  )
}

function VisitModal({ customer, hearts, onInvestigate, onReport, onHeart, onClose }) {
  const canUseHeart = hearts > 0 && customer.type === 'Risk' && !customer.decision
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section className="animate-modal-in w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-emerald-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-700">Customer Visit</p>
            <h2 className="mt-1 text-4xl font-black">{customer.icon} {customer.name}</h2>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-4 py-2 font-black text-slate-700">✕</button>
        </div>

        <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
          <SignalBadge type={customer.type} />
          <p className="mt-3 text-xl font-bold text-slate-800">{customer.vague}</p>
          <p className="mt-2 font-semibold text-slate-600">Impact: {customer.type === 'Opportunity' ? '+' : '-'}{stalks(customer.amount)}</p>
          <p className="mt-2 font-black text-emerald-900">
            {customer.investigated ? `Confirmed probability: ${customer.probability}%` : probabilityHint(customer.probability)}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {!customer.investigated && (
              <button onClick={onInvestigate} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 font-black text-white hover:bg-amber-600">
                <Search size={18} /> Investigate
              </button>
            )}
            {canUseHeart && (
              <button onClick={onHeart} className="inline-flex items-center gap-2 rounded-2xl bg-pink-500 px-4 py-3 font-black text-white hover:bg-pink-600">
                <Heart size={18} /> Use Heart ({hearts} left)
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button onClick={() => onReport('rolling')} className="rounded-2xl bg-slate-950 px-4 py-4 text-left font-black text-white hover:bg-emerald-700">
            Rolling Forecast
            <span className="block text-xs font-bold text-white/75">Commit it now.</span>
          </button>
          <button onClick={() => onReport('ro')} className="rounded-2xl bg-amber-500 px-4 py-4 text-left font-black text-white hover:bg-amber-600">
            Risk &amp; Opportunity
            <span className="block text-xs font-bold text-white/80">Flag it, don't commit.</span>
          </button>
          <button onClick={() => onReport('not_sig')} className="rounded-2xl bg-white px-4 py-4 text-left font-black text-slate-950 ring-2 ring-slate-200 hover:bg-slate-50">
            Not Significant
            <span className="block text-xs font-bold text-slate-500">Not significant to escalate to top management.</span>
          </button>
        </div>
      </section>
    </div>
  )
}

function RoundResult({ result, final, onContinue }) {
  const roundedTrustDelta = Math.round(result.trustDelta)
  const [opened, setOpened] = useState(() => new Set())
  const total = result.customers.length
  const allOpened = opened.size === total

  function reveal(id) {
    setOpened((current) => (current.has(id) ? current : new Set(current).add(id)))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <section className="animate-modal-in max-h-[92vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-emerald-100">
        <h2 className="text-4xl font-black">{result.emoji} {result.round} Close</h2>
        <p className="mt-2 text-lg font-bold text-slate-600">
          Target {stalks(result.targetTotal)} · Forecast {stalks(result.rollingTotal)} · Actual {stalks(result.roundActual)} · Trust {roundedTrustDelta >= 0 ? '+' : ''}{roundedTrustDelta}
        </p>
        <p className="mt-1 text-sm font-black text-amber-700">Tap each card to reveal what happened.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {result.customers.map((customer) => {
            const isOpen = opened.has(customer.id)
            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => reveal(customer.id)}
                className={`rounded-3xl p-4 text-left ring-1 transition ${customer.isCorrect ? 'bg-emerald-50 ring-emerald-100' : 'bg-red-50 ring-red-100'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black uppercase text-slate-400">{customer.name}</p>
                  {customer.isCorrect ? <CheckCircle2 className="text-emerald-600" size={22} /> : <XCircle className="text-red-500" size={22} />}
                </div>
                <p className="mt-1 font-black text-slate-800">{customer.type} · {customer.probability}%</p>
                <p className="mt-1 text-sm font-bold text-slate-600">
                  Said: {DECISION_LABEL[customer.chosen]}{customer.isCorrect ? '' : ` · Right call: ${DECISION_LABEL[customer.correctBucket]}`}
                </p>
                {isOpen ? (
                  <>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{ruleExplanation(customer.type, customer.probability)}</p>
                    <p className="mt-2 rounded-xl bg-white/70 p-2 text-sm font-black text-slate-700">
                      {customer.happens ? '✅ Happened' : '⬜ Did not happen'} · {stalks(customer.actualResult)} vs {stalks(customer.committed)} committed
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm font-black text-amber-700">Tap to see why →</p>
                )}
              </button>
            )
          })}
        </div>
        <button
          onClick={onContinue}
          disabled={!allOpened}
          className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 font-black text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
        >
          {allOpened ? (final ? 'Year-End Performance Review' : 'Continue') : `Tap all ${total} cards to continue (${opened.size}/${total})`}
        </button>
      </section>
    </div>
  )
}

function YearEndReview({ performance, history, onReset }) {
  const accuracy = performance.totalCount ? Math.round((performance.correctCount / performance.totalCount) * 100) : 0
  const landing = Math.round((performance.totalActual / ANNUAL_TARGET) * 100)
  const outcome = calculateFinalOutcome({ accuracy, trust: performance.trust })
  const roundedTrust = Math.round(performance.trust)
  const tone = {
    emerald: 'bg-emerald-50 ring-emerald-300',
    amber: 'bg-amber-50 ring-amber-300',
    red: 'bg-red-50 ring-red-300',
  }[outcome.tone]
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <section className={`animate-modal-in max-h-[94vh] w-full max-w-5xl overflow-auto rounded-[2rem] p-6 shadow-soft ring-8 ${tone}`}>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-500">Year-End Performance Review</p>
        <h2 className="mt-2 text-5xl font-black">{outcome.emoji} {outcome.title}</h2>
        <p className="mt-4 rounded-3xl bg-white/75 p-5 text-xl font-bold leading-relaxed text-slate-800">{outcome.feedback}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Classification Accuracy" value={`${accuracy}%`} helper={`${performance.correctCount} of ${performance.totalCount} correct`} tone="emerald" />
          <SummaryCard label="Management Trust" value={`${roundedTrust}/100`} tone="violet" />
          <SummaryCard label="Actual Stalks Sold" value={stalks(performance.totalActual)} helper={`${landing}% of annual target (${stalks(ANNUAL_TARGET)})`} tone="amber" />
        </div>
        <div className="mt-6 grid gap-2">
          {history.map((item) => (
            <p key={item.round} className="rounded-2xl bg-white/80 p-3 font-bold text-slate-700">
              {item.emoji} {item.round}: actual {stalks(item.roundActual)} vs target {stalks(item.targetTotal)}
            </p>
          ))}
        </div>
        <button onClick={onReset} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-xl font-black text-white hover:bg-emerald-700">
          <RotateCcw /> Restart Game
        </button>
      </section>
    </div>
  )
}

function HeartMeter({ hearts }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-pink-100 px-4 py-3 font-black text-pink-900 ring-1 ring-pink-200">
      <Heart size={18} /> Hearts: {hearts}
    </div>
  )
}

function ManagerPrompt({ onWorkHard }) {
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <section className="animate-modal-in w-full max-w-2xl rounded-[2rem] bg-white p-6 text-center shadow-soft ring-4 ring-red-200">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-5xl">🐼</div>
        <p className="mt-4 text-sm font-black uppercase tracking-[0.28em] text-red-600">Manager Panda</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">You landed below target.</h2>
        <p className="mt-3 font-bold text-slate-600">Answer a quick quiz to earn a Heart — use it to convert a Risk into an Opportunity next round.</p>
        <button onClick={onWorkHard} className="mt-6 w-full rounded-2xl bg-red-600 px-6 py-4 text-xl font-black text-white hover:bg-red-700">Work Hard</button>
      </section>
    </div>
  )
}

function QuizModal({ quiz, message, onAnswer }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <section className="animate-modal-in w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-soft ring-4 ring-pink-200">
        <HelpCircle className="text-pink-600" size={42} />
        <h2 className="mt-2 text-3xl font-black">Quick Quiz</h2>
        <p className="mt-2 font-bold text-slate-600">Consulting with customers, helping them out, and earning their trust.</p>
        <p className="mt-1 text-sm font-bold text-slate-500">Click until correct to earn a Heart.</p>
        <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-lg font-black">{quiz.question}</p>
        <div className="mt-4 grid gap-2">
          {quiz.options.map((option) => (
            <button key={option} onClick={() => onAnswer(option)} className="rounded-2xl bg-slate-100 px-4 py-3 text-left font-black hover:bg-emerald-100">{option}</button>
          ))}
        </div>
        {message && <p className="mt-4 rounded-2xl bg-pink-100 p-3 font-black text-pink-950">{message}</p>}
      </section>
    </div>
  )
}

function Scoreboard({ performance, history }) {
  const accuracy = performance.totalCount ? Math.round((performance.correctCount / performance.totalCount) * 100) : 0
  const landing = Math.round((performance.totalActual / ANNUAL_TARGET) * 100)
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white/90 p-5 shadow-soft">
      <h3 className="text-2xl font-black">Scoreboard</h3>
      <div className="mt-3 rounded-2xl bg-emerald-50 p-3 font-black text-emerald-950 ring-1 ring-emerald-100">
        Annual target: {stalks(ANNUAL_TARGET)} · Round target: {stalks(ROUND_TARGET)} each round
      </div>
      <div className="mt-3 grid gap-2">
        <Metric label="Classification Accuracy" value={`${accuracy}%`} helper={`${performance.correctCount}/${performance.totalCount} correct`} />
        <Metric label="Management Trust" value={`${Math.round(performance.trust)}/100`} />
        <Metric label="Actual Stalks Sold" value={stalks(performance.totalActual)} helper={`${landing}% of annual target`} />
      </div>
      <div className="mt-4 space-y-2">
        {history.map((item) => (
          <p key={item.round} className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-600">{item.emoji} {item.round}: actual {stalks(item.roundActual)}</p>
        ))}
      </div>
    </section>
  )
}

function SignalBadge({ type }) {
  const risk = type === 'Risk'
  return (
    <span className={`inline-flex max-w-full shrink-0 items-center gap-1 whitespace-normal rounded-full px-3 py-1 text-xs font-black leading-tight sm:text-sm ${risk ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
      {risk ? <TrendingDown size={16} className="shrink-0" /> : <TrendingUp size={16} className="shrink-0" />}<span>Potential {type}</span>
    </span>
  )
}

function Metric({ label, value, helper }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-emerald-100">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      {helper && <p className="text-sm font-bold leading-tight text-slate-500">{helper}</p>}
    </div>
  )
}

function SummaryCard({ label, value, helper, tone }) {
  const tones = { emerald: 'text-emerald-700', violet: 'text-violet-700', amber: 'text-amber-700', red: 'text-red-700' }
  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-lg">
      <p className="text-sm font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-2 text-4xl font-black ${tones[tone]}`}>{value}</p>
      {helper && <p className="mt-1 font-bold text-slate-600">{helper}</p>}
    </div>
  )
}
