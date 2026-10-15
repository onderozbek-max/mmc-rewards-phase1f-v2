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
  { threshold: 250, title: 'Community modules', description: 'Homepage modules are unlocked.' },
  { threshold: 1000, title: 'Basic IHUTs', description: 'You’re eligible for basic IHUTs.' },
  { threshold: 3000, title: 'Premium IHUTs', description: 'You’re eligible for premium IHUTs.' },
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

type PointsBand = {
  name: string
  title: string
  description: string
  floor: number
  ceiling: number
  nextLabel: string
}

function getPointsBand(points: number): PointsBand {
  if (points < 250) {
    return {
      name: 'Getting started',
      title: 'Unlock your community modules',
      description: 'Reach 250 points to unlock the homepage modules and start building your member momentum.',
      floor: 0,
      ceiling: 250,
      nextLabel: 'homepage modules',
    }
  }
  if (points < 1000) {
    return {
      name: 'Building momentum',
      title: 'Your community modules are unlocked',
      description: 'Keep sharing your perspective. At 1,000 points, you’ll be eligible for basic IHUTs.',
      floor: 250,
      ceiling: 1000,
      nextLabel: 'basic IHUT eligibility',
    }
  }
  if (points < 3000) {
    return {
      name: 'Basic IHUT eligible',
      title: 'Basic IHUTs are open to you',
      description: 'You’re eligible for basic IHUTs. Keep earning toward premium IHUT eligibility at 3,000 points.',
      floor: 1000,
      ceiling: 3000,
      nextLabel: 'premium IHUT eligibility',
    }
  }
  return {
    name: 'Premium IHUT eligible',
    title: 'You’ve reached premium territory',
    description: 'Premium IHUT eligibility is now part of your member journey. Keep participating to stay connected.',
    floor: 3000,
    ceiling: 3000,
    nextLabel: 'the highest tier',
  }
}

function getThresholdReached(weeks: number): number | null {
  return STREAK_THRESHOLDS.includes(weeks) ? weeks : null
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
  const modulesUnlocked = points >= 250
  const pointsToNext = band.ceiling === band.floor ? null : Math.max(0, band.ceiling - points)
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
        <div className="progress-track" aria-label={`${Math.round(pointsPercent)} percent toward ${band.nextLabel}`}><span style={{ width: `${pointsPercent}%` }} /></div>
        <p className="streak-line">{weeks}-week streak</p>
        <div className="card-footer-row"><span>{pointsToNext === null ? 'You reached the highest points band' : `${pointsToNext.toLocaleString()} points to ${band.nextLabel}`}</span><button className="text-button" type="button" onClick={() => onNavigate('pass')}>View pass <span aria-hidden="true">→</span></button></div>
      </section>

      <section aria-labelledby="whats-new-title">
        <div className="section-heading"><div><p className="eyebrow">Your access grows with you</p><h2 id="whats-new-title">Community modules</h2></div><span className="small-note">{modulesUnlocked ? 'Unlocked at 250 points' : 'Unlocks at 250 points'}</span></div>
        <p className="section-supporting-copy">{modulesUnlocked ? 'Your modules are ready. Keep earning toward your next member opportunity.' : `Reach 250 points to unlock these modules. You’re ${Math.max(0, 250 - points).toLocaleString()} points away.`}</p>
        <div className="new-grid">
          <CommunityModule unlocked={modulesUnlocked} icon="💡" title="Tell us what matters" description="Share feedback and help shape the Member’s Mark experience." />
          <CommunityModule unlocked={modulesUnlocked} icon="💬" title="Member moments" description="Connect with the community and discover what members are saying." />
        </div>
      </section>
    </div>
  )
}

function CommunityModule({ unlocked, icon, title, description }: { unlocked: boolean; icon: string; title: string; description: string }) {
  return (
    <article className={`new-card card${unlocked ? '' : ' locked'}`}>
      <span className="new-card-icon" aria-hidden="true">{unlocked ? icon : '🔒'}</span>
      <span className={`new-card-tag${unlocked ? ' unlocked' : ''}`}>{unlocked ? 'Available now' : 'Locked until 250 points'}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {unlocked ? <button className="card-link" type="button">Explore <span aria-hidden="true">→</span></button> : <span className="card-link muted">Keep earning to unlock</span>}
    </article>
  )
}

function PassPage({ points, weeks, protection, selectedGoal, goalComplete, onSelectGoal, onCompleteGoal }: { points: number; weeks: number; protection: ProtectionStatus; selectedGoal: number; goalComplete: boolean; onSelectGoal: (index: number) => void; onCompleteGoal: () => void }) {
  const band = getPointsBand(points)
  const pointsPercent = band.ceiling === band.floor ? 100 : Math.min(100, ((points - band.floor) / (band.ceiling - band.floor)) * 100)
  const pointsToNext = band.ceiling === band.floor ? null : Math.max(0, band.ceiling - points)
  const milestones = [
    { points: 250, title: 'Community modules', unlockedCopy: 'Homepage modules are unlocked.', lockedCopy: 'Unlock all homepage modules at 250 points.' },
    { points: 1000, title: 'Basic IHUTs', unlockedCopy: 'You’re eligible for basic IHUTs.', lockedCopy: 'Become eligible for basic IHUTs at 1,000 points.' },
    { points: 3000, title: 'Premium IHUTs', unlockedCopy: 'You’re eligible for premium IHUTs.', lockedCopy: 'Keep earning toward premium IHUTs at 3,000 points.' },
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
        <div><p className="eyebrow light-eyebrow">Member’s Mark member</p><p className="pass-points">{points.toLocaleString()} <span>points</span></p><p className="pass-caption">{band.name} · lifetime points never expire.</p></div>
        <div className="pass-seal" aria-hidden="true">M<span>MEMBER</span></div>
      </section>
      <section className="card pass-status-card" aria-labelledby="access-status-title">
        <div className="section-heading"><div><p className="eyebrow">Your current path</p><h2 id="access-status-title">{band.title}</h2></div><span className="status-pill">{band.name}</span></div>
        <p className="pass-status-copy">{band.description}</p>
        <div className="progress-track" aria-label={`${Math.round(pointsPercent)} percent toward ${band.nextLabel}`}><span style={{ width: `${pointsPercent}%` }} /></div>
        <div className="card-footer-row"><span>{pointsToNext === null ? 'You’ve reached the highest tier' : `${pointsToNext.toLocaleString()} points to ${band.nextLabel}`}</span><span>{Math.round(pointsPercent)}% complete</span></div>
      </section>
      <section className="card timeline-card" aria-labelledby="milestones-title">
        <div className="section-heading"><div><p className="eyebrow">Your journey</p><h2 id="milestones-title">Member milestones</h2></div><span className="small-note">Lifetime points</span></div>
        <div className="milestone-timeline">
          {milestones.map((milestone) => {
            const unlocked = points >= milestone.points
            return <div className={`milestone${unlocked ? ' unlocked' : ''}`} key={milestone.points}><div className="milestone-line" /><div className="milestone-icon" aria-hidden="true">{unlocked ? '✓' : '🔒'}</div><div className="milestone-copy"><div className="milestone-title-row"><h3>{milestone.title}</h3><span>{milestone.points.toLocaleString()} pts</span></div><p>{unlocked ? milestone.unlockedCopy : milestone.lockedCopy}</p></div></div>
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
