import { useEffect, useState, type ReactNode } from 'react'
import './styles.css'

type Page = 'home' | 'pass' | 'profile'
type ProtectionStatus = 'available' | 'used' | 'none'
type NavMode = 'prime' | 'secondary'

type AppParams = {
  page: Page
  points: number
  weeks: number
  goalComplete: boolean
  protection: ProtectionStatus
  nav: NavMode
}

type Goal = {
  title: string
  description: string
}

const GOALS: Goal[] = [
  {
    title: 'Answer a survey',
    description: 'Share a little of what you think with the community.',
  },
  {
    title: "Explore this week's Favorites",
    description: 'See what members are loving and discover a new favorite.',
  },
  {
    title: 'Share feedback on an idea',
    description: 'Help shape what the Member’s Mark community tries next.',
  },
]

const STREAK_THRESHOLDS = [4, 8, 12, 26]

const BENEFITS = [
  { threshold: 250, title: 'Member’s Mark welcome benefit', description: 'A little extra value for getting started.' },
  { threshold: 1000, title: 'Member’s Mark everyday benefit', description: 'More value unlocked as your points grow.' },
  { threshold: 3000, title: 'Member’s Mark premier benefit', description: 'Recognition for your long-term membership.' },
]

function readParams(): AppParams {
  const search = new URLSearchParams(window.location.search)
  const pageValue = search.get('page')
  const page: Page = pageValue === 'pass' || pageValue === 'profile' ? pageValue : 'home'
  const protectionValue = search.get('protection')
  const protection: ProtectionStatus = protectionValue === 'used' || protectionValue === 'none' ? protectionValue : 'available'
  const navValue = search.get('nav')
  const nav: NavMode = navValue === 'secondary' ? 'secondary' : 'prime'
  return {
    page,
    points: parseNonNegativeInt(search.get('points')),
    weeks: parseNonNegativeInt(search.get('weeks')),
    goalComplete: search.get('goal') === '1',
    protection,
    nav,
  }
}

function parseNonNegativeInt(value: string | null): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
}

function getPointsBand(points: number) {
  if (points < 250) return { name: 'Getting started', floor: 0, ceiling: 250 }
  if (points < 1000) return { name: 'Growing rewards', floor: 250, ceiling: 1000 }
  if (points < 3000) return { name: 'Member milestone', floor: 1000, ceiling: 3000 }
  return { name: 'Legacy member', floor: 3000, ceiling: 3000 }
}

function getThresholdReached(weeks: number): number | null {
  return STREAK_THRESHOLDS.includes(weeks) ? weeks : null
}

function getNextStreakThreshold(weeks: number): number | null {
  return STREAK_THRESHOLDS.find((threshold) => weeks < threshold) ?? null
}

function App() {
  const [params, setParams] = useState<AppParams>(() => readParams())
  const [selectedGoal, setSelectedGoal] = useState(0)
  const [goalComplete, setGoalComplete] = useState(params.goalComplete)

  useEffect(() => {
    const onPopState = () => setParams(readParams())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setGoalComplete(params.goalComplete)
  }, [params.goalComplete])

  const navigate = (page: Page) => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', page)
    window.history.pushState({}, '', url)
    setParams(readParams())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectGoal = (index: number) => {
    setSelectedGoal(index)
    setGoalComplete(false)
  }

  return (
    <div className="app-frame" data-nav-mode={params.nav}>
      <Header currentPage={params.page} onNavigate={navigate} />
      <main className="app-main">
        {params.page === 'home' && <HomePage points={params.points} weeks={params.weeks} onNavigate={navigate} />}
        {params.page === 'pass' && (
          <PassPage
            points={params.points}
            weeks={params.weeks}
            protection={params.protection}
            selectedGoal={selectedGoal}
            goalComplete={goalComplete}
            onSelectGoal={selectGoal}
            onCompleteGoal={() => setGoalComplete(true)}
          />
        )}
        {params.page === 'profile' && <ProfilePage points={params.points} weeks={params.weeks} />}
      </main>
      <BottomNav currentPage={params.page} onNavigate={navigate} />
    </div>
  )
}

function Header({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (page: Page) => void }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button className="brand-button" type="button" onClick={() => onNavigate('home')} aria-label="Go to Home">
          <span className="brand-mark">M</span>
          <span className="brand-copy">
            <strong>Member’s Mark</strong>
            <small>Community</small>
          </span>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <NavButton active={currentPage === 'home'} onClick={() => onNavigate('home')}>Home</NavButton>
          <NavButton active={currentPage === 'pass'} onClick={() => onNavigate('pass')}>My Pass</NavButton>
          <NavButton active={currentPage === 'profile'} onClick={() => onNavigate('profile')}>Profile</NavButton>
        </nav>
        <button className="avatar-button" type="button" onClick={() => onNavigate('profile')} aria-label="Open Profile">JM</button>
      </div>
    </header>
  )
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button className={`nav-button${active ? ' is-active' : ''}`} type="button" onClick={onClick} aria-current={active ? 'page' : undefined}>{children}</button>
}

function BottomNav({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (page: Page) => void }) {
  const items: { page: Page; label: string; icon: string }[] = [
    { page: 'home', label: 'Home', icon: '⌂' },
    { page: 'pass', label: 'Pass', icon: '▣' },
    { page: 'profile', label: 'Profile', icon: '◉' },
  ]
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => (
        <button key={item.page} className={`bottom-nav-item${currentPage === item.page ? ' is-active' : ''}`} type="button" onClick={() => onNavigate(item.page)} aria-current={currentPage === item.page ? 'page' : undefined}>
          <span className="bottom-nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="intro-description">{description}</p>}
      </div>
    </div>
  )
}

function HomePage({ points, weeks, onNavigate }: { points: number; weeks: number; onNavigate: (page: Page) => void }) {
  const band = getPointsBand(points)
  const pointsPercent = band.ceiling === band.floor ? 100 : Math.min(100, ((points - band.floor) / (band.ceiling - band.floor)) * 100)
  const nextStreak = getNextStreakThreshold(weeks)
  return (
    <div className="page-stack">
      <section className="home-welcome">
        <div>
          <p className="eyebrow">Good morning, Jamie</p>
          <h1>Make your membership matter.</h1>
          <p>Small moments of feedback help shape what comes next at Member’s Mark.</p>
        </div>
        <div className="welcome-sun" aria-hidden="true">☀️</div>
      </section>

      <section className="points-card card">
        <div className="card-heading-row">
          <div>
            <p className="eyebrow">Lifetime points</p>
            <h2>{points.toLocaleString()} <span>pts</span></h2>
          </div>
          <span className="status-pill">{band.name}</span>
        </div>
        <div className="progress-track" aria-label={`${Math.round(pointsPercent)} percent toward the next points band`}><span style={{ width: `${pointsPercent}%` }} /></div>
        <div className="streak-home-summary">
          <div className="streak-home-heading"><span className="streak-kicker">WEEKLY ACTIVITY</span><span className="streak-state">{weeks === 0 ? 'Ready to begin' : 'Keep the rhythm going'}</span></div>
          <div className="streak-home-row"><strong>{weeks}-week streak</strong><span>{nextStreak ? `${nextStreak - weeks} weeks to next badge` : 'Evergreen rhythm'}</span></div>
          <div className="streak-markers" aria-label="Streak badge progress">{STREAK_THRESHOLDS.map((threshold) => <span className={`streak-marker${weeks >= threshold ? ' earned' : ''}`} key={threshold} />)}</div>
        </div>
        <div className="card-footer-row"><span>{points < 3000 ? `${Math.max(0, band.ceiling - points).toLocaleString()} points to next band` : 'You reached the highest points band'}</span><button className="text-button" type="button" onClick={() => onNavigate('pass')}>View pass <span aria-hidden="true">→</span></button></div>
      </section>

      <section aria-labelledby="whats-new-title">
        <div className="section-heading"><div><p className="eyebrow">Keep discovering</p><h2 id="whats-new-title">What’s new</h2></div><button className="text-button" type="button">See all</button></div>
        <div className="new-grid">
          <article className="new-card card"><span className="new-card-icon">💡</span><span className="new-card-tag unlocked">Available now</span><h3>Tell us what matters</h3><p>Share feedback and help shape the Member’s Mark experience.</p><button className="card-link" type="button">Explore <span aria-hidden="true">→</span></button></article>
          <article className="new-card card locked"><span className="new-card-icon">🔒</span><span className="new-card-tag">Coming soon</span><h3>Member moments</h3><p>New ways to connect with the community are on the way.</p><span className="card-link muted">Locked for now</span></article>
        </div>
      </section>
    </div>
  )
}

function PassPage({ points, weeks, protection, selectedGoal, goalComplete, onSelectGoal, onCompleteGoal }: { points: number; weeks: number; protection: ProtectionStatus; selectedGoal: number; goalComplete: boolean; onSelectGoal: (index: number) => void; onCompleteGoal: () => void }) {
  const milestones = [
    { points: 250, title: 'First step', copy: 'You’re building momentum.' },
    { points: 1000, title: 'Growing strong', copy: 'Your membership is making a difference.' },
    { points: 3000, title: 'Long-term member', copy: 'A lasting part of the Member’s Mark community.' },
  ]
  const thresholdReached = getThresholdReached(weeks)
  const [toastVisible, setToastVisible] = useState(Boolean(thresholdReached))

  useEffect(() => {
    setToastVisible(Boolean(thresholdReached))
  }, [thresholdReached])

  return (
    <div className="page-stack">
      <PageIntro eyebrow="Your membership pass" title="Keep your progress close." description="Your lifetime points and member milestones, all in one place." />
      {thresholdReached && toastVisible && <StreakToast threshold={thresholdReached} onDismiss={() => setToastVisible(false)} />}
      <section className="pass-hero card">
        <div><p className="eyebrow light-eyebrow">Member’s Mark member</p><p className="pass-points">{points.toLocaleString()} <span>points</span></p><p className="pass-caption">Lifetime points never expire.</p></div>
        <div className="pass-seal" aria-hidden="true">M<span>MEMBER</span></div>
      </section>
      <section className="card timeline-card" aria-labelledby="milestones-title">
        <div className="section-heading"><div><p className="eyebrow">Your journey</p><h2 id="milestones-title">Member milestones</h2></div><span className="small-note">Lifetime points</span></div>
        <div className="milestone-timeline">
          {milestones.map((milestone) => {
            const unlocked = points >= milestone.points
            return <div className={`milestone${unlocked ? ' unlocked' : ''}`} key={milestone.points}><div className="milestone-line" /><div className="milestone-icon" aria-hidden="true">{unlocked ? '✓' : '🔒'}</div><div className="milestone-copy"><div className="milestone-title-row"><h3>{milestone.title}</h3><span>{milestone.points.toLocaleString()} pts</span></div><p>{unlocked ? milestone.copy : `Unlock at ${milestone.points.toLocaleString()} lifetime points.`}</p></div></div>
          })}
        </div>
      </section>
      <WeeklyActivity weeks={weeks} protection={protection} selectedGoal={selectedGoal} goalComplete={goalComplete} onSelectGoal={onSelectGoal} onCompleteGoal={onCompleteGoal} />
    </div>
  )
}

function StreakToast({ threshold, onDismiss }: { threshold: number; onDismiss: () => void }) {
  return <div className="toast" role="status" aria-live="polite"><span>You reached a {threshold}-week streak!</span><button className="toast-dismiss" type="button" onClick={onDismiss} aria-label="Dismiss streak notification">×</button></div>
}

function WeeklyActivity({ weeks, protection, selectedGoal, goalComplete, onSelectGoal, onCompleteGoal }: { weeks: number; protection: ProtectionStatus; selectedGoal: number; goalComplete: boolean; onSelectGoal: (index: number) => void; onCompleteGoal: () => void }) {
  return (
    <section className="card weekly-activity-section" aria-labelledby="weekly-activity-title">
      <div className="section-heading"><div><p className="eyebrow">Weekly progress</p><h2 id="weekly-activity-title">Weekly Activity</h2></div><span className="small-note">Illustrative preview</span></div>
      <div className="streak-focus">
        <div className="streak-count"><strong>{weeks}</strong><span>WEEK STREAK</span></div>
        <div className="streak-focus-copy"><strong>{weeks === 0 ? 'Start your first streak' : 'Your streak is active'}</strong><p>{getNextStreakThreshold(weeks) ? `Reach ${getNextStreakThreshold(weeks)} weeks to unlock your next cosmetic badge.` : 'You have reached every streak badge threshold.'}</p></div>
      </div>
      <p className="illustrative-note">An active week requires at least one qualifying Community activity completed that week — an illustrative placeholder while the activity definition remains a Phase 2 decision.</p>
      <div className="weekly-timeline" aria-label="Weekly streak milestones">
        {STREAK_THRESHOLDS.map((threshold) => {
          const unlocked = weeks >= threshold
          return <div className={`weekly-milestone${unlocked ? ' unlocked' : ''}`} key={threshold}><div className="milestone-icon" aria-hidden="true">{unlocked ? '✓' : '🔒'}</div><strong>{threshold}-Week Streak</strong><span>{unlocked ? 'Earned' : `Unlock at ${threshold} weeks`}</span></div>
        })}
      </div>
      <p className="cosmetic-note">Streak badges are cosmetic recognition only; they have no monetary or physical value.</p>
      <WeeklyGoalCard selectedGoal={selectedGoal} goalComplete={goalComplete} onSelectGoal={onSelectGoal} onCompleteGoal={onCompleteGoal} />
      <p className={`protection-line protection-${protection}`}>{protection === 'available' ? '1 Streak Protection available this month' : protection === 'used' ? 'Streak Protection used — welcome back' : 'Your streak reset — complete an activity this week to start a new one.'}</p>
    </section>
  )
}

function WeeklyGoalCard({ selectedGoal, goalComplete, onSelectGoal, onCompleteGoal }: { selectedGoal: number; goalComplete: boolean; onSelectGoal: (index: number) => void; onCompleteGoal: () => void }) {
  return (
    <article className="new-card card weekly-goal-card">
      <div className="weekly-goal-header"><div><span className={`new-card-tag${goalComplete ? ' unlocked' : ''}`}>{goalComplete ? 'Complete' : 'Incomplete'}</span><h3>This week’s focus</h3><p>Choose one illustrative Community activity to focus on this week.</p></div></div>
      <div className="goal-list">{GOALS.map((goal, index) => <button key={goal.title} className={`goal-option${selectedGoal === index ? ' selected' : ''}${selectedGoal === index && goalComplete ? ' completed' : ''}`} type="button" onClick={() => onSelectGoal(index)} aria-pressed={selectedGoal === index}><span className="goal-copy"><strong>{goal.title}</strong><small>{goal.description}</small></span><span className="goal-check" aria-hidden="true">{selectedGoal === index && goalComplete ? '✓' : selectedGoal === index ? '○' : ''}</span></button>)}</div>
      <div className="goal-action-row">{goalComplete ? <span className="completed-message">Complete — thank you for showing up.</span> : <button className="primary-button" type="button" onClick={onCompleteGoal}>Mark complete</button>}</div>
    </article>
  )
}

function ProfilePage({ points, weeks }: { points: number; weeks: number }) {
  const earnedStreaks = STREAK_THRESHOLDS.filter((threshold) => weeks >= threshold)
  return (
    <div className="page-stack">
      <PageIntro eyebrow="Your profile" title="Welcome back, Jamie." description="A record of the ways you show up for the community." />
      <section className="profile-card card"><div className="profile-avatar">JM</div><div><h2>Jamie Member</h2><p>Member since 2024</p></div><span className="profile-points">{points.toLocaleString()} pts</span></section>
      <section className="card benefits-section" aria-labelledby="benefits-title"><div className="section-heading"><div><p className="eyebrow">Your member record</p><h2 id="benefits-title">Benefits Unlocked</h2></div><span className="small-note">Lifetime points and weekly activity</span></div><div className="benefit-list">{BENEFITS.map((benefit) => { const unlocked = points >= benefit.threshold; return <div className={`benefit-row${unlocked ? ' unlocked' : ''}`} key={benefit.threshold}><span className="benefit-icon" aria-hidden="true">{unlocked ? '✓' : '🔒'}</span><div><h3>{benefit.title}</h3><p>{unlocked ? benefit.description : `Unlock at ${benefit.threshold.toLocaleString()} lifetime points.`}</p></div><span className="benefit-status">{unlocked ? 'Unlocked' : 'Locked'}</span></div> })}{earnedStreaks.map((threshold) => <div className="benefit-row unlocked" key={threshold}><span className="benefit-icon" aria-hidden="true">✓</span><div><h3>{threshold}-Week Streak — Earned</h3><p>Cosmetic recognition for consistent weekly activity.</p></div><span className="benefit-status">Earned</span></div>)}</div></section>
    </div>
  )
}

export default App
