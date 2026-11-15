import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Headphones, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { useGame } from '../game/store'
import ThemeToggle from '../game/ThemeToggle'

export default function Welcome() {
  const [value, setValue] = useState('')
  const setName = useGame((s) => s.setName)
  const startSiteSelection = useGame((s) => s.startSiteSelection)
  const muted = useGame((s) => s.muted)
  const toggleMute = useGame((s) => s.toggleMute)

  const stars = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        id: i,
        x: (i * 37.7) % 100,
        y: (i * 61.3) % 100,
        size: 1 + ((i * 7) % 15) / 10,
        delay: ((i * 11) % 30) / 10,
      })),
    []
  )

  function start() {
    const name = value.trim()
    if (!name) return
    setName(name)
    startSiteSelection()
  }

  return (
    <main className="welcome-shell">
      <section className="welcome-art" aria-label="Animated Moon mission illustration">
        <div className="welcome-stars" aria-hidden="true">
          {stars.map((star) => (
            <motion.i
              key={star.id}
              style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size }}
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 2.4, delay: star.delay, repeat: Infinity }}
            />
          ))}
        </div>
        <div className="welcome-art-copy">
          <div className="brand-mark">
            <span className="brand-lockup"><strong>LUNAR OUTPOST ACADEMY</strong><small>SSRO</small></span>
          </div>
          <p className="art-eyebrow">YOUR NEXT BIG ADVENTURE</p>
          <h2>One small step.<br />One amazing mission.</h2>
          <p>Meet your Moon crew and help them make it through ten days in space.</p>
        </div>

        <motion.div
          className="welcome-moon"
          animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
        <div className="welcome-horizon" aria-hidden="true">
          <div className="welcome-dome"><span /></div>
          <div className="welcome-panel"><i /><i /><i /><i /></div>
          <div className="welcome-crater crater-one" />
          <div className="welcome-crater crater-two" />
        </div>
        <motion.div
          className="welcome-astronaut"
          animate={{ y: [0, -12, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 180 220" role="presentation">
            <ellipse cx="92" cy="205" rx="54" ry="9" fill="#14152a" opacity=".8" />
            <path d="M56 126 Q90 107 124 126 L137 188 Q91 204 44 188Z" fill="#f3f5ff" stroke="#a8b2df" strokeWidth="4" />
            <path d="M61 145 35 174 23 166 43 130M119 144l26 28 11-9-18-39" fill="none" stroke="#dce3ff" strokeWidth="14" strokeLinecap="round" />
            <path d="m66 185-8 22M116 185l8 22" stroke="#c6cee9" strokeWidth="15" strokeLinecap="round" />
            <path d="M52 72a39 39 0 1 1 78 0v30a39 39 0 0 1-78 0Z" fill="#f4f6ff" stroke="#a8b2df" strokeWidth="4" />
            <path d="M60 76a31 31 0 0 1 62 0v18a31 31 0 0 1-62 0Z" fill="#17345a" stroke="#74d8ff" strokeWidth="4" />
            <path d="M68 79q20-16 43-7" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".7" />
            <circle cx="90" cy="155" r="13" fill="#80e4ff" />
            <path d="M84 155h12M90 149v12" stroke="#17406a" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </motion.div>
        <div className="art-caption"><Sparkles size={16} /> Captain Luna is ready to meet you</div>
      </section>

      <section className="welcome-form-wrap">
        <div className="welcome-form">
          <div className="mobile-brand brand-mark">
            <span className="brand-lockup"><strong>LUNAR OUTPOST ACADEMY</strong><small>SSRO</small></span>
          </div>
          <div className="welcome-topline">
            <div className="welcome-step">ASTRONAUT CHECK-IN <span>01 / 03</span></div>
            <button
              className="welcome-sound-toggle"
              onClick={toggleMute}
              aria-label={muted ? 'Turn narration on' : 'Turn narration off'}
              title={muted ? 'Turn narration on' : 'Turn narration off'}
            >
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <ThemeToggle />
          </div>
          <h1>Hi, space explorer!</h1>
          <p className="welcome-intro">What should Captain Luna call you?</p>
          <p className="welcome-description">Type your first name. Luna will use it while she shows you around the Moon base.</p>

          <label className="name-label" htmlFor="astronaut-name">YOUR ASTRONAUT NAME</label>
          <input
            id="astronaut-name"
            autoFocus
            maxLength={15}
            autoComplete="given-name"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && start()}
            placeholder="Type your name"
          />
          <button className="start-mission" onClick={start} disabled={!value.trim()}>
            Meet Captain Luna <ArrowRight size={20} />
          </button>
          <div className="welcome-promise">
            <Headphones size={18} />
            <span className="welcome-guide-copy">
              <small><i /> GUIDED MISSION <b>READY</b></small>
              <strong>Captain Luna is here to help.</strong>
              <span>You can listen, read, and go at your own pace.</span>
            </span>
          </div>
          <div className="welcome-footer"><span>MADE FOR CURIOUS MINDS</span><span>AGES 5–8</span></div>
        </div>
      </section>
    </main>
  )
}
