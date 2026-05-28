// Limperiam portfolio — main React app.
// One long-scroll editorial page. All content keyed by language.
// Animations are scroll-triggered via IntersectionObserver + small per-element transitions.

const { useState, useEffect, useRef, useCallback, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "lang": "fr",
  "theme": "light",
  "accent": "#d85b3d",
  "showCursor": true
}/*EDITMODE-END*/;

/* ── Reveal hook ──────────────────────────────────────────────── */
function useReveal(opts = {}) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    // If already in viewport at mount (above-the-fold), reveal immediately —
    // IntersectionObserver fires async and feels delayed for hero content.
    const r = el.getBoundingClientRect();
    // Hidden tabs throttle CSS transitions to currentTime=0 forever — skip
    // the from-state entirely if we mount while not visible.
    if (document.visibilityState === "hidden") {
      setSeen(true);
      return;
    }
    if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        });
      },
      { threshold: opts.threshold ?? 0.15, rootMargin: opts.rootMargin ?? "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

/* Tagged-text helper for word-by-word display reveal */
function WordReveal({ text, className = "", baseDelay = 0 }) {
  const [ref, seen] = useReveal({ threshold: 0.4 });
  const words = useMemo(() => text.split(/(\s+)/).filter((w) => w.length > 0), [text]);
  return (
    <span ref={ref} className={`word-reveal ${seen ? "is-in" : ""} ${className}`}>
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return <span key={i}>{w}</span>;
        const delayIdx = i + baseDelay;
        return (
          <span key={i} className="w" style={{ "--i": delayIdx }}>
            {w}
          </span>
        );
      })}
    </span>
  );
}

/* Scroll-up reveal wrapper */
function Reveal({ children, delay = 0, as = "div", className = "", ...rest }) {
  const [ref, seen] = useReveal();
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={`r-up ${seen ? "is-in" : ""} ${className}`}
      style={{ "--delay": `${delay}ms`, ...(rest.style || {}) }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ── Top bar ──────────────────────────────────────────────────── */
function TopBar({ t, lang, setLang, theme, setTheme }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`topbar ${scrolled ? "is-scrolled" : ""}`}>
      <a href="#top" className="brand">
        <span className="status-wrap" tabIndex={0} aria-label={t.hero.status_label}>
          <span className="dot" />
          <span className="tip">{t.hero.status_label}</span>
        </span>
        {t.brand}
      </a>
      <nav>
        <a href="#approach">{t.nav.about}</a>
        <a href="#work">{t.nav.work}</a>
        <a href="#stack">{t.nav.stack}</a>
        <a href="#contact">{t.nav.contact}</a>
      </nav>
      <div className="controls">
        <div className="lang-switch" role="tablist" aria-label="Language">
          <button
            className={lang === "fr" ? "is-active" : ""}
            onClick={() => setLang("fr")}
            aria-pressed={lang === "fr"}
          >
            FR
          </button>
          <button
            className={lang === "en" ? "is-active" : ""}
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
        </div>
        <button
          className="ctl"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === "dark" ? "☼" : "☾"}
        </button>
      </div>
    </header>
  );
}

/* ── Hero ─────────────────────────────────────────────────────── */
function Hero({ t }) {
  return (
    <section className="hero section" id="top">
      <div className="hero-mark" aria-hidden="true">L</div>
      <div className="shell">
        <Reveal>
          <span className="kicker kicker--accent">{t.hero.kicker}</span>
        </Reveal>
        <h1 className="display">
          <WordReveal text={t.hero.headline_pre} />
          <span className="it"><WordReveal text={t.hero.headline_em} baseDelay={3} /></span>
          <WordReveal text={t.hero.headline_post} baseDelay={5} />
          <br />
          <span className="it"><WordReveal text={t.hero.headline_post2} baseDelay={7} /></span>
        </h1>
        <Reveal delay={500} className="hero-sub">
          <p style={{ margin: 0 }}>{t.hero.sub}</p>
        </Reveal>
        <Reveal delay={650} className="hero-actions">
          <a href="#work" className="btn btn--primary" data-magnetic>
            {t.hero.cta_primary}
            <span className="arrow">→</span>
          </a>
          <a href="#contact" className="btn btn--ghost" data-magnetic>
            {t.hero.cta_secondary}
          </a>
        </Reveal>
      </div>
      <div className="hero-foot">
        <span className="hero-status"><span className="pip" />{t.hero.meta_left}</span>
        <span>{t.hero.meta_right}</span>
      </div>
    </section>
  );
}

/* ── About / pillars ──────────────────────────────────────────── */
function About({ t }) {
  return (
    <section className="section section--alt" id="approach">
      <div className="shell">
        <div className="about-grid">
          <div>
            <Reveal><span className="kicker">{t.about.kicker}</span></Reveal>
            <h2 className="h2">
              <WordReveal text={t.about.headline_pre} />
              <span className="it"><WordReveal text={t.about.headline_em} baseDelay={2} /></span>
              <WordReveal text={t.about.headline_post} baseDelay={4} />
            </h2>
          </div>
          <Reveal delay={200}>
            <p className="lede" style={{ margin: 0 }}>{t.about.lede}</p>
          </Reveal>
        </div>
        <div className="pillars">
          {t.about.pillars.map((p, i) => (
            <Reveal key={i} delay={i * 120} className="pillar">
              <div className="num">{p.k}</div>
              <div className="ttl">
                {p.t_pre}
                <span className="it">{p.t_em}</span>
              </div>
              <div className="desc">{p.d}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Work ────────────────────────────────────────────────────── */
function WorkItem({ item, idx }) {
  const [ref, seen] = useReveal();
  const [open, setOpen] = useState(false);
  return (
    <article
      ref={ref}
      className={`work-item r-up ${seen ? "is-in" : ""} ${open ? "is-open" : ""}`}
      style={{ "--delay": `${idx * 60}ms` }}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="num">{item.n}</div>
      <div className="meta-col">
        <span className="year">{item.year}</span>
        <span className="client">{item.client}</span>
        <span className="role">{item.role}</span>
      </div>
      <div>
        <h3 className="ttl" style={{ margin: 0, fontWeight: 400 }}>
          {item.headline_pre}
          <span className="it">{item.headline_em}</span>
          {item.headline_post || ""}
        </h3>
      </div>
      <div>
        <p className="desc" style={{ margin: 0 }}>{item.summary}</p>
        <div className="tags">
          {item.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
        </div>
      </div>
      <div className="arrow-cell">
        <span className="arrow-chip" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </div>
      {item.stats && (
        <div className="stats">
          {item.stats.map((s, i) => (
            <div className="stat" key={i}>
              <div className="v">{s.v}</div>
              <div className="l">{s.l}</div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function Work({ t }) {
  return (
    <section className="section" id="work">
      <div className="shell">
        <div className="work-head">
          <div>
            <Reveal><span className="kicker">{t.work.kicker}</span></Reveal>
            <h2 className="h2">
              <WordReveal text={t.work.headline_pre} />
              <span className="it"><WordReveal text={t.work.headline_em} baseDelay={3} /></span>
              <WordReveal text={t.work.headline_post} baseDelay={5} />
            </h2>
          </div>
          <Reveal delay={200}>
            <p className="sub" style={{ margin: 0 }}>{t.work.sub}</p>
          </Reveal>
        </div>
        <div className="work-list">
          {t.work.items.map((item, i) => <WorkItem key={item.n} item={item} idx={i} />)}
        </div>
      </div>
    </section>
  );
}

/* ── Stack + marquee ─────────────────────────────────────────── */
function Stack({ t }) {
  const marqueeItems = useMemo(() => {
    return t.stack.groups.flatMap((g) => g.items);
  }, [t]);
  const marqueeText = (
    <>
      {marqueeItems.map((it, i) => (
        <React.Fragment key={i}>
          {i % 3 === 1 ? <span className="it">{it}</span> : <span>{it}</span>}
          <span className="dot">·</span>
        </React.Fragment>
      ))}
    </>
  );
  return (
    <section className="section section--alt" id="stack">
      <div className="shell">
        <div className="work-head">
          <div>
            <Reveal><span className="kicker">{t.stack.kicker}</span></Reveal>
            <h2 className="h2">
              <WordReveal text={t.stack.headline_pre} />
              <span className="it"><WordReveal text={t.stack.headline_em} baseDelay={2} /></span>
            </h2>
          </div>
          <Reveal delay={200}>
            <p className="sub" style={{ margin: 0 }}>{t.stack.sub}</p>
          </Reveal>
        </div>
        <div className="stack-grid">
          {t.stack.groups.map((g, i) => (
            <Reveal key={g.t} delay={i * 100} className="stack-card">
              <h3>{g.t}</h3>
              <ul>
                {g.items.map((it) => <li key={it}>{it}</li>)}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {marqueeText}
          {marqueeText}
        </div>
      </div>
    </section>
  );
}

/* ── Contact ─────────────────────────────────────────────────── */
function Contact({ t }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(t.contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* noop */ }
  }, [t.contact.email]);
  return (
    <section className="section contact" id="contact">
      <div className="shell">
        <Reveal><span className="kicker">{t.contact.kicker}</span></Reveal>
        <h2 className="h2">
          <WordReveal text={t.contact.headline_pre} />
          <span className="it"><WordReveal text={t.contact.headline_em} baseDelay={3} /></span>
        </h2>
        <Reveal delay={200}>
          <p className="sub" style={{ margin: "16px 0 0" }}>{t.contact.sub}</p>
        </Reveal>
        <div className="contact-grid">
          <Reveal delay={300} className="email-row">
            <a href={`mailto:${t.contact.email}`} className="email-mega">
              {t.contact.email}
            </a>
            <button className={`copy-btn ${copied ? "is-copied" : ""}`} onClick={copy}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {copied ? (
                  <polyline points="20 6 9 17 4 12" />
                ) : (
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </>
                )}
              </svg>
              {copied ? t.contact.copied_label : t.contact.copy_label}
            </button>
          </Reveal>
          <Reveal delay={420}>
            <ul className="elsewhere">
              {t.contact.links.map((lk) => (
                <li key={lk.l}>
                  <a href={lk.h} target="_blank" rel="noreferrer noopener">
                    {lk.l}
                    <span className="arrow">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────── */
function Footer({ t }) {
  return (
    <footer className="foot">
      <div>
        <span className="b">{t.footer.brand}</span>
        <span style={{ marginLeft: 12 }}>— {t.footer.tagline}</span>
      </div>
      <div>{t.footer.colophon}</div>
    </footer>
  );
}

/* ── Legal ──────────────────────────────── */
function Legal({ t }) {
  if (!t.legal) return null;
  return (
    <section className="section" id="legal">
      <div className="shell">
        <Reveal>
          <span className="kicker">{t.legal.kicker}</span>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="h2">
            {t.legal.headline_pre}
            <span className="it">{t.legal.headline_em}</span>
          </h2>
        </Reveal>
        <Reveal delay={220}>
          <p className="sub">{t.legal.sub}</p>
        </Reveal>
        <div className="legal-grid">
          <Reveal delay={280}>
            <a className="legal-link" href={t.legal.link.h} target="_blank" rel="noopener noreferrer">
              {t.legal.link.l}
              <span aria-hidden="true">↗</span>
            </a>
          </Reveal>
          <div className="legal-table">
            {t.legal.rows.map((r, i) => (
              <Reveal key={r.l} delay={120 + i * 60}>
                <div className="legal-row">
                  <span className="l">{r.l}</span>
                  <span className="v">{r.v}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Cursor + scroll progress ─────────────────────────────────── */
function CustomCursor({ enabled }) {
  const dot = useRef(null);
  const ring = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    let rx = window.innerWidth / 2, ry = window.innerHeight / 2;
    let dx = rx, dy = ry;
    let raf;
    const onMove = (e) => {
      dx = e.clientX; dy = e.clientY;
      if (dot.current) {
        dot.current.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      }
    };
    const tick = () => {
      rx += (dx - rx) * 0.18;
      ry += (dy - ry) * 0.18;
      if (ring.current) {
        ring.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove);

    const onOver = (e) => {
      const interactive = e.target.closest && e.target.closest('a, button, [data-magnetic], [data-cursor="hover"]');
      if (ring.current) ring.current.classList.toggle("is-hover", !!interactive);
    };
    document.addEventListener("mouseover", onOver);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
    };
  }, [enabled]);
  if (!enabled) return null;
  return (
    <>
      <div className="cursor-dot" ref={dot} />
      <div className="cursor-ring" ref={ring} />
    </>
  );
}

function ScrollProgress() {
  const ref = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="progress" ref={ref} />;
}

/* ── Magnetic effect on data-magnetic elements ───────────────── */
function useMagnetic() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-magnetic]"));
    const onMove = (el) => (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
    };
    const onLeave = (el) => () => { el.style.transform = ""; };
    const handlers = els.map((el) => {
      const m = onMove(el), l = onLeave(el);
      el.addEventListener("mousemove", m);
      el.addEventListener("mouseleave", l);
      el.style.transition = "transform 360ms cubic-bezier(.2,.7,.15,1)";
      return { el, m, l };
    });
    return () => handlers.forEach(({ el, m, l }) => {
      el.removeEventListener("mousemove", m);
      el.removeEventListener("mouseleave", l);
    });
  });
}

/* ── App ─────────────────────────────────────────────────────── */
function App() {
  const [values, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const lang = values.lang || "fr";
  const theme = values.theme || "light";
  const accent = values.accent || "#d85b3d";
  const showCursor = values.showCursor !== false;

  // Apply theme + accent at root
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
    document.documentElement.style.setProperty("--accent", accent);
  }, [theme, lang, accent]);

  // Hidden-tab defense: if we mount while the tab isn't visible, CSS
  // transitions are paused at t=0 and reveals would stay invisible forever.
  // Short-circuit via a body class until the tab becomes visible again.
  useEffect(() => {
    const apply = () => {
      document.body.classList.toggle(
        "no-reveal-anim",
        document.visibilityState === "hidden"
      );
    };
    apply();
    document.addEventListener("visibilitychange", apply);
    return () => document.removeEventListener("visibilitychange", apply);
  }, []);

  useMagnetic();

  const t = window.PORTFOLIO_CONTENT[lang];

  return (
    <>
      <ScrollProgress />
      <CustomCursor enabled={showCursor} />
      <TopBar
        t={t}
        lang={lang}
        setLang={(l) => setTweak("lang", l)}
        theme={theme}
        setTheme={(th) => setTweak("theme", th)}
      />
      <main>
        <Hero t={t} />
        <About t={t} />
        <Work t={t} />
        <Stack t={t} />
        <Contact t={t} />
        <Legal t={t} />
      </main>
      <Footer t={t} />

      {/* Tweaks panel */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Language">
          <window.TweakRadio
            value={lang}
            onChange={(v) => setTweak("lang", v)}
            options={[{ value: "fr", label: "FR" }, { value: "en", label: "EN" }]}
          />
        </window.TweakSection>
        <window.TweakSection label="Theme">
          <window.TweakRadio
            value={theme}
            onChange={(v) => setTweak("theme", v)}
            options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
          />
        </window.TweakSection>
        <window.TweakSection label="Accent">
          <window.TweakColor
            value={accent}
            onChange={(v) => setTweak("accent", v)}
            options={["#d85b3d", "#6b8e65", "#3a6db5", "#1a1614"]}
          />
        </window.TweakSection>
        <window.TweakSection label="Custom cursor">
          <window.TweakToggle
            value={showCursor}
            onChange={(v) => setTweak("showCursor", v)}
          />
        </window.TweakSection>
      </window.TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
