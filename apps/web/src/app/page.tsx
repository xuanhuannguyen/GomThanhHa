"use client";

import { claimRequestSchema, playerSchema, type ClaimResponse } from "@binh-gom/shared";
import { ChevronRight, Gift, Phone, ShieldCheck, Sparkles, User, Ticket, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { claimPrize, getState, registerPlayer } from "@/lib/api";

type FormState = {
  name: string;
  phone: string;
};

const emptyForm: FormState = {
  name: "",
  phone: ""
};

const potHitSoundPath = "/audio/pot-hit-click.mp3";
const potBreakSoundPath = "/audio/pot-final-magic-break.mp3";
const backgroundMusicPath = "/audio/music-background.mp3";

function playAudioFile(src: string, volume = 1) {
  if (typeof window === 'undefined') return;
  try {
    const sound = new Audio(src);
    sound.currentTime = 0;
    sound.volume = volume;
    void sound.play();
  } catch (e) {
    console.warn("Sound playback bypassed", e);
  }
}

function playFinalBreakImpact() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(92, now);
    boom.frequency.exponentialRampToValueAtTime(34, now + 0.38);
    boomGain.gain.setValueAtTime(0.5, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start(now);
    boom.stop(now + 0.45);

    const bufferSize = Math.floor(ctx.sampleRate * 0.42);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const envelope = Math.pow(1 - i / bufferSize, 2.4);
      const burst = i % 41 < 4 ? 1.5 : 0.55;
      data[i] = (Math.random() * 2 - 1) * envelope * burst;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + 0.18);
    filter.Q.setValueAtTime(2.8, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  } catch (e) {
    console.warn("Final break impact bypassed", e);
  }
}

function playSpinningSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 1.8);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2.0;
    
    filter.frequency.setValueAtTime(300, now);
    for (let j = 0; j < 6; j++) {
      filter.frequency.linearRampToValueAtTime(1400, now + j * 0.3 + 0.15);
      filter.frequency.linearRampToValueAtTime(300, now + j * 0.3 + 0.3);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
    gain.gain.setValueAtTime(0.4, now + 1.5);
    gain.gain.linearRampToValueAtTime(0, now + 1.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 1.8);
  } catch (e) {
    console.warn("Spinning sound bypassed", e);
  }
}

// Play the selected pottery impact sound on every tap.
function playPhysicalSound(type: 'wobble' | 'shake' | 'shatter') {
  if (type === 'shatter') {
    playAudioFile(potBreakSoundPath, 1);
    playFinalBreakImpact();
    return;
  }

  playAudioFile(potHitSoundPath, type === 'shake' ? 0.95 : 0.82);
}

// Shard color resolver based on selected pot index style
function getShardColor(pot: number) {
  const colors = ["#c85c40", "#148a7a", "#2261b8", "#c89340", "#2b2b2b", "#16849b"];
  return colors[(pot - 1) % colors.length] ?? "#c85c40";
}

function getShardPalette(pot: number) {
  const base = getShardColor(pot);
  return {
    glaze: base,
    clay: pot === 2 || pot === 5 ? "#8b3a27" : pot === 4 ? "#d58263" : "#b5573f",
    raw: "#f0b08d",
    soot: "#2b1a15"
  };
}

function shuffleArray(array: number[]) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = current;
  }
  return arr;
}

function getGridCoords(slotIndex: number) {
  const col = slotIndex % 3;
  const row = Math.floor(slotIndex / 3);
  const x = col === 0 ? "20%" : col === 1 ? "50%" : "80%";
  const y = row === 0 ? "34%" : "72%";
  return { x, y };
}

function seededRandom(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function getPrizeTotalsFromState(state: Awaited<ReturnType<typeof getState>>) {
  return {
    experienceTicket: state.inventory.find((item) => item.prizeCode === "experience_ticket")?.totalQty ?? 5,
    toHe: state.inventory.find((item) => item.prizeCode === "to_he")?.totalQty ?? 20
  };
}

function renderPrizeDisplay(prizeLabel: string) {
  const label = prizeLabel.toLowerCase();

  // Check if it is a ticket
  if (label.includes("ve") || label.includes("vé") || label.includes("ticket")) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
        <Ticket size={48} className="text-brand" style={{ color: 'var(--brand)' }} />
        <span className="font-serif" style={{ fontSize: '1.55rem', fontWeight: 700, color: 'var(--brand-dark)', textAlign: 'center', lineHeight: '1.3' }}>
          {prizeLabel}
        </span>
      </div>
    );
  }

  // Check if it is a Toy figurine (Tò He)
  if (label.includes("to he") || label.includes("tò he") || label.includes("toy")) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
        <span style={{ fontSize: '3.2rem', display: 'inline-block' }}>🐉</span>
        <span className="font-serif" style={{ fontSize: '1.55rem', fontWeight: 700, color: 'var(--brand-dark)', textAlign: 'center', lineHeight: '1.3' }}>
          {prizeLabel}
        </span>
      </div>
    );
  }

  // Standard text replacements
  let displayLabel = prizeLabel;
  if (label.includes("cam on") || label.includes("tham gia")) {
    displayLabel = "Chúc bạn may mắn lần sau!";
  } else if (label.includes("may man") || label.includes("lan sau")) {
    displayLabel = "Chúc bạn may mắn lần sau!";
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
      <Sparkles size={44} style={{ color: 'var(--gold)' }} />
      <span className="font-serif" style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--brand-dark)', textAlign: 'center', lineHeight: '1.3' }}>
        {displayLabel}
      </span>
    </div>
  );
}

export default function PlayerPage() {
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});
  const [deviceId, setDeviceId] = useState("");
  const [resetVersion, setResetVersion] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [prizeTotals, setPrizeTotals] = useState({
    experienceTicket: 5,
    toHe: 20
  });

  // 3D Orbiting & Zoom focus states
  const [zoomedPot, setZoomedPot] = useState<number | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [animatingPot, setAnimatingPot] = useState<number | null>(null);
  const [animationClass, setAnimationClass] = useState("");

  const [result, setResult] = useState<ClaimResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Onboarding overlay control (Option A)
  const [hasInfo, setHasInfo] = useState(false);
  const [onboardingExit, setOnboardingExit] = useState(false);

  // Staggered entrance, rapid spin, and grid states
  const [isEntering, setIsEntering] = useState(false);
  const [isSpinningFast, setIsSpinningFast] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridTransitioning, setGridTransitioning] = useState(false);
  const [shuffledSlots, setShuffledSlots] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [showGuide, setShowGuide] = useState(false);
  const [isBackgroundMusicOn, setIsBackgroundMusicOn] = useState(false);

  const interactionBlocked = isEntering || isSpinningFast || gridTransitioning;

  function playBackgroundMusic() {
    const music = backgroundMusicRef.current;
    if (!music) return false;

    music.volume = 0.34;
    void music.play()
      .then(() => {
        setIsBackgroundMusicOn(true);
      })
      .catch((musicError: unknown) => {
        console.warn("Background music playback bypassed", musicError);
        setIsBackgroundMusicOn(false);
      });

    return true;
  }

  function handleBackgroundMusicToggle() {
    const music = backgroundMusicRef.current;
    if (!music) return;

    if (isBackgroundMusicOn) {
      if (music.paused) {
        playBackgroundMusic();
      } else {
        music.pause();
        setIsBackgroundMusicOn(false);
      }
      return;
    }

    playBackgroundMusic();
  }

  // Generate static trajectories for flying shards, hairline cracks, and dust explosions
  const shardsData = useMemo(() => {
    return [...Array(34)].map((_, i) => {
      const angle = (i / 34) * 2 * Math.PI + (seededRandom(i, 1) - 0.5) * 0.35;
      const power = 120 + seededRandom(i, 2) * 230 + (i % 5) * 18;
      const tx = Math.cos(angle) * power;
      const ty = Math.sin(angle) * power - 80 + Math.max(0, i - 24) * 12;
      const mx = Math.cos(angle) * (power * 0.42);
      const my = Math.sin(angle) * (power * 0.24) - 70 - seededRandom(i, 3) * 55;
      const rot = (seededRandom(i, 4) * 780 - 390).toFixed(1);
      const endRot = Number(rot) + (seededRandom(i, 5) > 0.5 ? 360 : -360);
      const size = 5 + seededRandom(i, 6) * (i < 12 ? 22 : 12);
      const thickness = 0.72 + seededRandom(i, 7) * 0.7;
      const duration = 720 + seededRandom(i, 8) * 380;
      const delay = seededRandom(i, 9) * 70;
      const type = (i % 5) + 1;
      const tone = i % 7 === 0 ? "raw" : i % 5 === 0 ? "clay" : i % 11 === 0 ? "soot" : "glaze";
      return { tx, ty, mx, my, rot, endRot, size, thickness, duration, delay, type, tone };
    });
  }, []);

  const crackData = useMemo(() => {
    return [
      { x: 49, y: 16, length: 58, angle: 100, delay: 0, width: 3 },
      { x: 48, y: 39, length: 44, angle: 26, delay: 45, width: 2 },
      { x: 51, y: 43, length: 48, angle: 154, delay: 70, width: 2 },
      { x: 44, y: 55, length: 36, angle: 96, delay: 95, width: 2 },
      { x: 57, y: 31, length: 28, angle: 65, delay: 115, width: 1.5 },
      { x: 39, y: 35, length: 26, angle: 218, delay: 130, width: 1.5 },
      { x: 58, y: 58, length: 34, angle: 35, delay: 145, width: 1.5 },
      { x: 36, y: 63, length: 28, angle: 142, delay: 165, width: 1.5 }
    ];
  }, []);

  const dustData = useMemo(() => {
    return [...Array(18)].map((_, i) => {
      const angle = (i / 18) * 2 * Math.PI + (seededRandom(i, 10) - 0.5) * 0.5;
      const tx = Math.cos(angle) * (90 + seededRandom(i, 11) * 180);
      const ty = Math.sin(angle) * (80 + seededRandom(i, 12) * 150) - 10;
      const scale = 1.4 + seededRandom(i, 13) * 2.4;
      const delay = seededRandom(i, 14) * 120;
      return { tx, ty, scale, delay };
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load or generate device ID
    let storedDeviceId = localStorage.getItem("binh_gom_device_id");
    if (!storedDeviceId) {
      storedDeviceId = crypto.randomUUID();
      localStorage.setItem("binh_gom_device_id", storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    getState()
      .then((state) => {
        setResetVersion(state.resetVersion);
        setPrizeTotals(getPrizeTotalsFromState(state));

        // Load stored form data
        const storedFormStr = localStorage.getItem("binh_gom_form");
        if (storedFormStr) {
          try {
            setForm(JSON.parse(storedFormStr));
          } catch (e) {
            console.error("Error parsing stored form", e);
          }
        }

        // Load stored result
        const storedResultStr = localStorage.getItem("binh_gom_result");
        if (storedResultStr) {
          try {
            const parsedResult = JSON.parse(storedResultStr) as ClaimResponse;
            if (parsedResult.resetVersion === state.resetVersion) {
              setResult(parsedResult);
              setHasInfo(true);
              setZoomedPot(null);
            } else {
              localStorage.removeItem("binh_gom_result");
            }
          } catch (e) {
            console.error("Error parsing stored result", e);
          }
        }
        setIsInitialized(true);
      })
      .catch((stateError: unknown) => {
        setError(stateError instanceof Error ? stateError.message : "Không thể tải trạng thái chiến dịch");
        setIsInitialized(true);
      });
  }, []);

  // Onboarding Submission (Option A Validation)
  async function handleOnboardingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validation = playerSchema.safeParse({
      ...form,
      deviceId
    });

    if (!validation.success) {
      const fieldErrors: { name?: string; phone?: string } = {};
      validation.error.errors.forEach((err) => {
        const path = err.path[0] as keyof FormState;
        if (path) {
          fieldErrors[path] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    setFormErrors({});
    playBackgroundMusic();

    const normalizedData = {
      name: validation.data.name,
      phone: validation.data.phone
    };

    setForm(normalizedData);
    setLoading(true);

    try {
      await registerPlayer({
        ...normalizedData,
        deviceId
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối máy chủ");
      setLoading(false);
      return;
    }
    
    setLoading(false);

    // Save normalized form data to localStorage
    localStorage.setItem("binh_gom_form", JSON.stringify(normalizedData));

    // Beautiful exit sliding door transition
    setOnboardingExit(true);
    setTimeout(() => {
      setHasInfo(true);
      setIsEntering(true);
      setShuffledSlots(shuffleArray([0, 1, 2, 3, 4, 5]));

      // Phase 1: Staggered Spawn (2.5s)
      setTimeout(() => {
        setIsEntering(false);
        setIsSpinningFast(true);
        playSpinningSound();

        // Phase 2: Rapid Spin 3 rounds (1.8s)
        setTimeout(() => {
          setIsSpinningFast(false);
          setGridTransitioning(true);
          setShowGrid(true);

          // Phase 3: Transition to grid completed (1.0s)
          setTimeout(() => {
            setGridTransitioning(false);
          }, 1000);
        }, 1800);
      }, 2500);
    }, 800);
  }

  // Trigger campaign claim
  async function handleClaim(potId: number) {
    setError("");
    setLoading(true);

    try {
      const version = resetVersion ?? 1;
      const idempotencyKey = `${deviceId}-${version}-${crypto.randomUUID()}`;

      const payload = claimRequestSchema.parse({
        name: form.name,
        phone: form.phone,
        deviceId,
        idempotencyKey
      });

      const claimed = await claimPrize(payload);

      // Delay display to fully showcase the shatter explosion animation
      setTimeout(() => {
        setResult(claimed);
        localStorage.setItem("binh_gom_result", JSON.stringify(claimed));
        setLoading(false);
      }, 950);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Không thể nhận quà");
      setLoading(false);
      setTapCount(0);
      setAnimatingPot(null);
      setAnimationClass("");
    }
  }

  // Handle Select Pot to Zoom Focus
  function handlePotSelect(potId: number) {
    if (loading || result || interactionBlocked) return;
    setZoomedPot(potId);
    setTapCount(0);
    setAnimatingPot(null);
    setAnimationClass("");
  }

  // Handle Interactive Tap on Zoomed Pot
  function handleZoomedPotTap(potId: number) {
    if (loading || result || animationClass === "shatter") return;

    const nextTap = tapCount + 1;
    if (nextTap === 1) {
      setTapCount(1);
      setAnimatingPot(potId);
      setAnimationClass("wobble");
      playPhysicalSound('wobble');
      setTimeout(() => {
        setAnimatingPot(null);
        setAnimationClass("");
      }, 300);
    } else if (nextTap === 2) {
      setTapCount(2);
      setAnimatingPot(potId);
      setAnimationClass("shake");
      playPhysicalSound('shake');
      setTimeout(() => {
        setAnimatingPot(null);
        setAnimationClass("");
      }, 400);
    } else if (nextTap >= 3) {
      setTapCount(3);
      setAnimatingPot(potId);
      setAnimationClass("shatter");
      playPhysicalSound('shatter');
      handleClaim(potId);
    }
  }

  // Close Focus Zoom View and return to lobby
  function closeFocusView() {
    setZoomedPot(null);
    setTapCount(0);
    setAnimatingPot(null);
    setAnimationClass("");
  }

  async function handleOpenGuide() {
    setError("");

    try {
      const state = await getState();
      setResetVersion(state.resetVersion);
      setPrizeTotals(getPrizeTotalsFromState(state));
    } catch (guideError) {
      setError(guideError instanceof Error ? guideError.message : "Không thể cập nhật hướng dẫn");
    } finally {
      setShowGuide(true);
    }
  }

  if (!isInitialized) {
    return (
      <div className="page game-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative' }}>
        {/* Dynamic Background Embers for a Kiln Glow */}
        <div className="kiln-embers">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="ember"
              style={{
                left: `${(i * 11) % 100}%`,
                animationDelay: `${(i * 0.7) % 5}s`,
                animationDuration: `${5 + (i % 4)}s`
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 10 }}>
          <Sparkles className="animate-spin" color="var(--gold)" size={48} />
          <p className="font-serif" style={{ color: 'var(--brand-dark)', fontSize: '1.25rem', letterSpacing: '0.05em' }}>
            Đang vào xưởng gốm...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`page ${hasInfo ? "game-page" : ""}`}>
      <audio ref={backgroundMusicRef} src={backgroundMusicPath} loop preload="auto" />
      {hasInfo && (
        <button
          className={`music-toggle ${isBackgroundMusicOn ? "is-on" : ""}`}
          type="button"
          aria-label={isBackgroundMusicOn ? "Tắt nhạc nền" : "Bật nhạc nền"}
          title={isBackgroundMusicOn ? "Tắt nhạc nền" : "Bật nhạc nền"}
          onClick={(event) => {
            event.stopPropagation();
            handleBackgroundMusicToggle();
          }}
        >
          {isBackgroundMusicOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      )}

      {/* Dynamic Background Embers for a Kiln Glow */}
      <div className="kiln-embers">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="ember"
            style={{
              left: `${(i * 11) % 100}%`,
              animationDelay: `${(i * 0.7) % 5}s`,
              animationDuration: `${5 + (i % 4)}s`
            }}
          />
        ))}
      </div>

      {/* Onboarding Overlay (Option A) */}
      {!hasInfo && (
        <div className={`onboarding-overlay ${onboardingExit ? "exit" : ""}`}>
          <div className="onboarding-vase-left" aria-hidden="true"></div>
          <div className="onboarding-vase-right" aria-hidden="true"></div>
          <div className="onboarding-leaves" aria-hidden="true"></div>
          <div className="onboarding-pedestal">
            <div className="onboarding-header">
              <div className="onboarding-mark" aria-hidden="true">
                <span></span>
              </div>
              <div className="onboarding-logo font-serif">SẮC GỐM CỔ THỊ</div>
              <h2 className="onboarding-title font-serif">GỐM ƠI MỞ RA</h2>
              <p className="onboarding-quote font-serif">
                "Từ đất, thành gốm. Từ người, thành di sản"
              </p>
              <div className="onboarding-divider" aria-hidden="true"><span></span></div>
            </div>

            <div className="onboarding-form-body">
              <form className="onboarding-form" onSubmit={handleOnboardingSubmit}>
                <div className="field onboarding-field">
                  <div className="onboarding-field-icon" aria-hidden="true">
                    <User size={28} />
                  </div>
                  <div className="onboarding-field-control">
                    <label htmlFor="name">Họ và Tên</label>
                    <input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))}
                      placeholder="Nhập họ và tên của bạn"
                      autoComplete="off"
                    />
                  </div>
                  {formErrors.name && <span className="error-bubble field-error">{formErrors.name}</span>}
                </div>

                <div className="field onboarding-field">
                  <div className="onboarding-field-icon" aria-hidden="true">
                    <Phone size={27} />
                  </div>
                  <div className="onboarding-field-control">
                    <label htmlFor="phone">Số Điện Thoại</label>
                    <input
                      id="phone"
                      type="tel"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9+]/g, '');
                        if (val.startsWith('+84')) val = '0' + val.slice(3);
                        else if (val.startsWith('84') && val.length >= 2) val = '0' + val.slice(2);
                        val = val.replace(/[^0-9]/g, '').slice(0, 10);
                        setForm((curr) => ({ ...curr, phone: val }));
                      }}
                      placeholder="Nhập số điện thoại"
                      autoComplete="off"
                    />
                  </div>
                  {formErrors.phone && <span className="error-bubble field-error">{formErrors.phone}</span>}
                </div>

                {error && (
                  <div className="error-bubble" style={{ marginBottom: "16px" }}>
                    {error}
                  </div>
                )}

                <button className="button onboarding-submit" type="submit" disabled={loading}>
                  <span className="onboarding-submit-pot" aria-hidden="true"></span>
                  {loading ? "Đang ghi danh..." : "Bước vào Xưởng Gốm"}
                  {!loading && <ChevronRight size={26} />}
                </button>

                <p className="onboarding-privacy">
                  <ShieldCheck size={24} />
                  <span>Thông tin của bạn được bảo mật và chỉ sử dụng để xác nhận khi nhận quà tại sự kiện.</span>
                </p>
              </form>
            </div>

            <div className="onboarding-footer font-serif">
              <span></span>
            </div>
          </div>
        </div>
      )}

      {hasInfo && (
        <>
          <header className="game-header">
            <h1 className="game-title font-serif">SẮC GỐM CỔ THỊ</h1>
            {!result && (
              <button className="guide-button" type="button" onClick={handleOpenGuide}>
                Hướng Dẫn
              </button>
            )}
          </header>

          <main className="game-stage" aria-label="Khu chọn bình gốm" style={result && zoomedPot === null ? { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)' } : undefined}>
            {!result && (
              <section className="borderless-orbit-section">
                <div className="orbit-scene-container">
                  <div className={`pots-orbit-ring ${isEntering ? "is-entering" : ""} ${isSpinningFast ? "is-spinning-fast" : ""} ${showGrid ? "is-grid" : ""}`}>
                    {[1, 2, 3, 4, 5, 6].map((pot) => {
                      const slotIndex = shuffledSlots[pot - 1] ?? 0;
                      const coords = getGridCoords(slotIndex);
                      return (
                        <button
                          className="pot-orbit-item"
                          key={pot}
                          style={{
                            '--index': pot - 1,
                            '--angle': `${(pot - 1) * 60}deg`,
                            '--angle-neg': `${(pot - 1) * -60}deg`,
                            '--grid-x': coords.x,
                            '--grid-y': coords.y
                          } as any}
                          type="button"
                          disabled={interactionBlocked}
                          aria-label={`Chọn bình số ${pot}`}
                          onClick={() => handlePotSelect(pot)}
                        >
                          <div className={`pot-3d style-pot-${pot}`}>
                            <div className="pot-lip-3d"></div>
                            <div className="pot-neck-3d"></div>
                            <div className="pot-body-3d">
                              <div className="pot-body-pattern"></div>
                              <div className="pot-body-glow"></div>
                            </div>
                            <div className="pot-base-3d"></div>
                          </div>
                          <div className="pot-shadow"></div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {result && zoomedPot === null && (
              <div className="result-container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '24px 12px' }}>
                <div className="result-panel" style={{ width: '100%', maxWidth: '380px' }}>
                  <div className="result-header">
                    <Gift size={18} /> Khai Quật Thành Công!
                  </div>
                  {renderPrizeDisplay(result.prizeLabel)}
                </div>
              </div>
            )}

            {error && !zoomedPot ? <div className="error-bubble game-error">{error}</div> : null}
          </main>

          {showGuide ? (
            <div className="guide-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="guide-title" onClick={() => setShowGuide(false)}>
              <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
                <h2 id="guide-title" className="font-serif guide-modal-title">HƯỚNG DẪN</h2>
                <div className="guide-modal-divider" aria-hidden="true"><span></span></div>

                <div className="guide-content-scroll" style={{ textAlign: 'center' }}>
                  <div className="guide-section" style={{ alignItems: 'center' }}>
                    <h3 className="font-serif guide-section-title" style={{ justifyContent: 'center', width: '100%' }}>🎁 Phần Quà May Mắn</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 20px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '1.05rem', color: '#533b31' }}>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                        <Ticket size={20} className="text-brand" style={{ color: 'var(--brand)' }} />
                        <span><strong>{prizeTotals.experienceTicket} Vé tham quan</strong> làng gốm Thanh Hà</span>
                      </li>
                      <li style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🐉</span>
                        <span><strong>{prizeTotals.toHe} Tò he</strong> 12 con giáp</span>
                      </li>
                    </ul>
                  </div>

                  <div className="guide-section" style={{ marginTop: '10px' }}>
                    <h3 className="font-serif guide-section-title" style={{ justifyContent: 'center', width: '100%' }}>🎮 Cách Chơi</h3>
                    <p style={{ fontSize: '0.96rem', lineHeight: '1.5', color: '#533b31', margin: '8px 0 0' }}>
                      Chọn vào bình gốm bất kỳ để đập vỡ nó, nếu may mắn bạn có thể nhận một trong những phần quà trên.
                    </p>
                  </div>
                </div>

                <button className="button guide-close-btn" type="button" onClick={() => setShowGuide(false)}>
                  Đã Hiểu
                </button>
              </div>
            </div>
          ) : null}

          {/* Focus Zoom overlay for pot breaking */}
          {zoomedPot !== null && (
            <div className={`pot-focus-overlay ${animationClass === "shatter" ? "is-final-smash" : ""}`}>
              <div className="pot-focus-content">

                {/* Top Info HUD */}
                {!loading && !result && (
                  <div style={{ position: 'absolute', top: '48px', left: 0, right: 0, textAlign: 'center', zIndex: 10 }}>
                    <p style={{ color: 'var(--gold)', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.5)', margin: 0 }}>
                      Tiếp tục Chạm
                    </p>
                  </div>
                )}

                {/* Giant Focused 3D CSS Pot */}
                <button
                  className={`pot-3d style-pot-${zoomedPot} pot-zoomed ${animatingPot === zoomedPot ? animationClass : ""}`}
                  onClick={() => handleZoomedPotTap(zoomedPot)}
                  type="button"
                  disabled={loading || Boolean(result) || animationClass === "shatter"}
                  style={{ border: 'none', background: 'none', outline: 'none' }}
                >
                  <div className="pot-lip-3d"></div>
                  <div className="pot-neck-3d"></div>
                  <div className="pot-body-3d">
                    <div className="pot-body-pattern"></div>
                    <div className="pot-body-glow"></div>
                    <div className={`pot-cracks-overlay ${tapCount === 1 ? "level-1" : ""} ${tapCount >= 2 ? "level-2" : ""}`}>
                      {crackData.map((crack, i) => (
                        <span
                          key={i}
                          className="crack-line"
                          style={{
                            '--crack-x': `${crack.x}%`,
                            '--crack-y': `${crack.y}%`,
                            '--crack-l': `${crack.length}%`,
                            '--crack-a': `${crack.angle}deg`,
                            '--crack-d': `${crack.delay}ms`,
                            '--crack-w': `${crack.width}px`
                          } as any}
                        />
                      ))}
                    </div>

                    <div className="shatter-flash"></div>
                    <div className="shatter-shockwave"></div>

                    {/* Flying absolute CSS shards (Explosion trajectory) */}
                    {shardsData.map((shard, i) => (
                      <div
                        key={i}
                        className={`shard shard-type-${shard.type}`}
                        style={{
                          '--tx': `${shard.tx}px`,
                          '--ty': `${shard.ty}px`,
                          '--mx': `${shard.mx}px`,
                          '--my': `${shard.my}px`,
                          '--rot': `${shard.rot}deg`,
                          '--end-rot': `${shard.endRot}deg`,
                          '--shard-thickness': `${shard.thickness}px`,
                          '--shard-duration': `${shard.duration}ms`,
                          '--shard-delay': `${shard.delay}ms`,
                          width: `${shard.size}px`,
                          height: `${shard.size}px`,
                          backgroundColor: getShardPalette(zoomedPot)[shard.tone as keyof ReturnType<typeof getShardPalette>],
                          left: `${28 + (i * 7) % 44}%`,
                          top: `${24 + (i * 11) % 48}%`,
                        } as any}
                      />
                    ))}

                    {/* Flying dust clouds */}
                    {dustData.map((dust, i) => (
                      <div
                        key={i}
                        className="dust"
                        style={{
                          '--tx': `${dust.tx}px`,
                          '--ty': `${dust.ty}px`,
                          '--dust-scale': dust.scale,
                          '--dust-delay': `${dust.delay}ms`,
                          left: '40%',
                          top: '40%',
                        } as any}
                      />
                    ))}
                  </div>
                  <div className="pot-base-3d"></div>
                  <div className="pot-shadow"></div>
                </button>

                {/* Loading text spinner */}
                {loading && (
                  <div style={{ position: 'absolute', color: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 20 }}>
                    <Sparkles className="animate-spin" color="var(--gold)" size={36} />
                    <span className="font-serif" style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}>Đang mở bảo vật...</span>
                  </div>
                )}

                {/* Result ticket displayed inside the focused modal */}
                {result && (
                  <div className="result-panel animate-fade-in" style={{ zIndex: 30, width: '100%', maxWidth: '380px', marginTop: '-20px' }}>
                    <div className="result-header">
                      <Gift size={18} /> Khai Quật Thành Công!
                    </div>
                    {renderPrizeDisplay(result.prizeLabel)}

                    <button
                      className="button"
                      style={{ marginTop: '24px', width: '100%' }}
                      onClick={closeFocusView}
                      type="button"
                    >
                      Xác Nhận
                    </button>
                  </div>
                )}

                {/* Error handling */}
                {error && (
                  <div className="error-bubble" style={{ zIndex: 30, width: '100%', maxWidth: '380px' }}>
                    {error}
                    <button
                      className="button ghost"
                      style={{ width: '100%', marginTop: '12px', minHeight: 'auto', padding: '6px' }}
                      onClick={() => { setError(""); closeFocusView(); }}
                      type="button"
                    >
                      Quay lại
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
