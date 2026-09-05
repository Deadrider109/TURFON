import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  Clock3,
  Gift,
  RefreshCw,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react"

import { supabase } from "../lib/supabase"

function AnimatedNumber({ value, duration = 1.2 }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const target = Number(value || 0)
    const start = performance.now()

    let frame

    const animate = (time) => {
      const elapsed = time - start
      const progress = Math.min(elapsed / (duration * 1000), 1)

      const eased =
        1 - Math.pow(1 - progress, 3)

      setDisplay(Math.round(target * eased))

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return display.toLocaleString()
}

function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 32 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 5 + 4,
        delay: Math.random() * 3,
      })),
    []
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-[#B7E600]"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            opacity: 0.12,
          }}
          animate={{
            y: [0, -25, 0],
            x: [0, 8, -6, 0],
            opacity: [0.08, 0.28, 0.08],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

function ProgressRing({ progress }) {
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const offset =
    circumference -
    (progress / 100) * circumference

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <svg
        width="176"
        height="176"
        viewBox="0 0 176 176"
        className="-rotate-90"
      >
        <circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
        />

        <motion.circle
          cx="88"
          cy="88"
          r={radius}
          fill="none"
          stroke="#B7E600"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{
            strokeDashoffset: circumference,
          }}
          animate={{
            strokeDashoffset: offset,
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
          style={{
            filter:
              "drop-shadow(0 0 9px rgba(183,230,0,0.55))",
          }}
        />
      </svg>

      <div className="absolute text-center">
        <p className="text-4xl font-black text-white">
          <AnimatedNumber value={progress} />%
        </p>

        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
          Progress
        </p>
      </div>
    </div>
  )
}

function Rewards() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [rewardData, setRewardData] = useState(null)
  const [checkpoints, setCheckpoints] = useState([])
  const [transactions, setTransactions] = useState([])
  const [offers, setOffers] = useState([])

  async function loadRewards(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true)
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate("/login", { replace: true })
        return
      }

      const [
        rewardResult,
        checkpointsResult,
        transactionsResult,
        offersResult,
      ] = await Promise.all([
        supabase.rpc("get_member_reward_data", {
          member_id: user.id,
        }),

        supabase
          .from("reward_checkpoints")
          .select("*")
          .eq("is_active", true)
          .order("points_required", {
            ascending: true,
          }),

        supabase
          .from("reward_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(10),

        supabase
          .from("community_offers")
          .select("*")
          .eq("is_active", true)
          .order("required_points", {
            ascending: true,
          }),
      ])

      if (rewardResult.error) {
        console.error(
          "Reward data error:",
          rewardResult.error
        )
      }

      if (checkpointsResult.error) {
        console.error(
          "Checkpoint error:",
          checkpointsResult.error
        )
      }

      if (transactionsResult.error) {
        console.error(
          "Transaction error:",
          transactionsResult.error
        )
      }

      if (offersResult.error) {
        console.error(
          "Offers error:",
          offersResult.error
        )
      }

      let reward = rewardResult.data

      if (Array.isArray(reward)) {
        reward = reward[0] || null
      }

      setRewardData(reward || null)
      setCheckpoints(checkpointsResult.data || [])
      setTransactions(
        transactionsResult.data || []
      )
      setOffers(offersResult.data || [])
    } catch (error) {
      console.error(
        "Rewards page error:",
        error
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadRewards()
  }, [])

  const points = Number(
    rewardData?.points || 0
  )

  const lifetimePoints = Number(
    rewardData?.lifetime_points || 0
  )

  const nextCheckpoint = useMemo(() => {
    return (
      checkpoints.find(
        (checkpoint) =>
          Number(
            checkpoint.points_required
          ) > points
      ) || null
    )
  }, [checkpoints, points])

  const previousCheckpoint = useMemo(() => {
    const reached = checkpoints.filter(
      (checkpoint) =>
        Number(
          checkpoint.points_required
        ) <= points
    )

    return reached[reached.length - 1] || null
  }, [checkpoints, points])

  const progress = useMemo(() => {
    if (!nextCheckpoint) {
      return 100
    }

    const currentRequired =
      previousCheckpoint
        ? Number(
            previousCheckpoint.points_required
          )
        : 0

    const nextRequired = Number(
      nextCheckpoint.points_required
    )

    const range =
      nextRequired - currentRequired

    if (range <= 0) {
      return 100
    }

    const current =
      ((points - currentRequired) / range) *
      100

    return Math.max(
      0,
      Math.min(100, current)
    )
  }, [
    nextCheckpoint,
    points,
    previousCheckpoint,
  ])

  const pointsToNext = nextCheckpoint
    ? Math.max(
        0,
        Number(
          nextCheckpoint.points_required
        ) - points
      )
    : 0

  const status =
    rewardData?.title ||
    previousCheckpoint?.title ||
    "Starter"

  const statusDescription =
    rewardData?.description ||
    previousCheckpoint?.description ||
    "Keep playing and earning points to unlock the next Sportiva milestone."

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07100C] text-white">
        <div className="flex items-center gap-3">
          <RefreshCw
            size={18}
            className="animate-spin text-[#B7E600]"
          />

          <span className="text-sm font-semibold">
            Initializing rewards...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#07100C] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-15%] top-[-10%] h-[420px] w-[420px] rounded-full bg-[#B7E600]/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#176B3A]/[0.14] blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#07100C]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <motion.button
            type="button"
            onClick={() => navigate("/dashboard")}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.96 }}
            className="group flex items-center gap-2 text-sm font-semibold text-white/55 transition hover:text-white"
          >
            <ArrowLeft
              size={17}
              className="transition group-hover:text-[#B7E600]"
            />

            Dashboard
          </motion.button>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={() => loadRewards(true)}
              disabled={refreshing}
              whileHover={{ rotate: 25 }}
              whileTap={{ scale: 0.92 }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/65 transition hover:border-[#B7E600]/30 hover:text-[#B7E600] disabled:opacity-40"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </motion.button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        {/* Heading */}
        <section className="mb-7">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                rotate: [0, 8, -8, 0],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Sparkles
                size={16}
                className="text-[#B7E600]"
              />
            </motion.div>

            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#B7E600]/70">
              SPORTIVA REWARDS
            </p>
          </div>

          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
            Level up your game.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/40">
            Every session moves you closer to the next
            Sportiva reward.
          </p>
        </section>

        {/* Hero */}
        <motion.section
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
          }}
          className="relative overflow-hidden rounded-[28px] border border-[#B7E600]/10 bg-gradient-to-br from-[#123B27] via-[#0D291C] to-[#07100C] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:p-8"
        >
          <ParticleField />

          <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full border border-[#B7E600]/10" />
          <div className="absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full border border-[#B7E600]/10" />

          <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(183,230,0,0)",
                      "0 0 32px rgba(183,230,0,0.18)",
                      "0 0 0 rgba(183,230,0,0)",
                    ],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#B7E600]/20 bg-[#B7E600]/[0.08]"
                >
                  <Trophy
                    size={25}
                    className="text-[#B7E600]"
                  />
                </motion.div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
                    CURRENT STATUS
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {status}
                  </h2>
                </div>
              </div>

              <p className="mt-6 max-w-md text-sm leading-6 text-white/50">
                {statusDescription}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <motion.div
                  whileHover={{
                    y: -3,
                    borderColor:
                      "rgba(183,230,0,0.25)",
                  }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                    CURRENT POINTS
                  </p>

                  <p className="mt-2 text-3xl font-black text-[#B7E600]">
                    <AnimatedNumber
                      value={points}
                    />
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{
                    y: -3,
                    borderColor:
                      "rgba(183,230,0,0.25)",
                  }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                    LIFETIME
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    <AnimatedNumber
                      value={lifetimePoints}
                    />
                  </p>
                </motion.div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <ProgressRing progress={progress} />

              <div className="mt-2 text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">
                  NEXT MILESTONE
                </p>

                <h3 className="mt-2 text-xl font-black">
                  {nextCheckpoint?.title ||
                    "Maximum level reached"}
                </h3>

                {nextCheckpoint ? (
                  <p className="mt-2 text-xs text-white/40">
                    {pointsToNext} points remaining
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-[#B7E600]/60">
                    You reached every available milestone.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Stats */}
        <section className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Star,
              label: "Current points",
              value: points,
            },
            {
              icon: Zap,
              label: "Lifetime points",
              value: lifetimePoints,
            },
            {
              icon: Award,
              label: "Next target",
              value: nextCheckpoint
                ? nextCheckpoint.points_required
                : "MAX",
            },
          ].map((item, index) => {
            const Icon = item.icon

            return (
              <motion.div
                key={item.label}
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    0.15 + index * 0.08,
                }}
                whileHover={{
                  y: -4,
                }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 backdrop-blur-xl"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B7E600]/[0.08]">
                  <Icon
                    size={18}
                    className="text-[#B7E600]"
                  />
                </div>

                <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.16em] text-white/30">
                  {item.label}
                </p>

                <p className="mt-1 text-2xl font-black">
                  {typeof item.value === "number" ? (
                    <AnimatedNumber
                      value={item.value}
                    />
                  ) : (
                    item.value
                  )}
                </p>
              </motion.div>
            )
          })}
        </section>

        {/* Milestones */}
        <section className="mt-7">
          <div className="mb-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#B7E600]/60">
              PROGRESSION
            </p>

            <h2 className="mt-1 text-xl font-black">
              Milestones
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-[24px] top-6 bottom-6 w-px bg-white/[0.07]" />

            <div className="space-y-3">
              {checkpoints.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center">
                  <p className="text-sm text-white/35">
                    No reward milestones have been configured yet.
                  </p>
                </div>
              ) : (
                checkpoints.map(
                  (checkpoint, index) => {
                    const reached =
                      points >=
                      Number(
                        checkpoint.points_required
                      )

                    return (
                      <motion.div
                        key={checkpoint.id}
                        initial={{
                          opacity: 0,
                          x: -15,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          delay:
                            0.1 +
                            index * 0.06,
                        }}
                        whileHover={{
                          x: 5,
                        }}
                        className={`relative flex items-center gap-4 rounded-2xl border p-4 ${
                          reached
                            ? "border-[#B7E600]/15 bg-[#B7E600]/[0.05]"
                            : "border-white/[0.06] bg-white/[0.025]"
                        }`}
                      >
                        <div
                          className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                            reached
                              ? "border-[#B7E600]/25 bg-[#B7E600]/10 text-[#B7E600]"
                              : "border-white/[0.08] bg-[#101915] text-white/25"
                          }`}
                        >
                          {reached ? (
                            <Check size={18} />
                          ) : (
                            <Award size={18} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold">
                              {checkpoint.title}
                            </h3>

                            {reached && (
                              <span className="rounded-full bg-[#B7E600]/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-[#B7E600]">
                                Unlocked
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-white/35">
                            {checkpoint.description ||
                              "Sportiva milestone reward"}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-lg font-black">
                            {Number(
                              checkpoint.points_required
                            ).toLocaleString()}
                          </p>

                          <p className="text-[8px] font-bold uppercase tracking-wider text-white/25">
                            points
                          </p>
                        </div>
                      </motion.div>
                    )
                  }
                )
              )}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mt-7">
          <div className="mb-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#B7E600]/60">
              BENEFITS
            </p>

            <h2 className="mt-1 text-xl font-black">
              Unlockable rewards
            </h2>
          </div>

          {offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <Gift
                size={26}
                className="mx-auto text-white/20"
              />

              <p className="mt-3 text-sm text-white/35">
                No active rewards are available yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {offers.map((offer, index) => {
                const required = Number(
                  offer.required_points || 0
                )

                const unlocked =
                  points >= required

                return (
                  <motion.div
                    key={offer.id}
                    initial={{
                      opacity: 0,
                      y: 18,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        0.1 + index * 0.08,
                    }}
                    whileHover={{
                      y: -4,
                    }}
                    className={`relative overflow-hidden rounded-2xl border p-5 ${
                      unlocked
                        ? "border-[#B7E600]/15 bg-gradient-to-br from-[#B7E600]/[0.06] to-white/[0.025]"
                        : "border-white/[0.06] bg-white/[0.025]"
                    }`}
                  >
                    {unlocked && (
                      <motion.div
                        animate={{
                          x: ["-120%", "120%"],
                        }}
                        transition={{
                          duration: 2.6,
                          repeat: Infinity,
                          repeatDelay: 3,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-y-0 w-20 -skew-x-12 bg-gradient-to-r from-transparent via-[#B7E600]/10 to-transparent"
                      />
                    )}

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#B7E600]/[0.08]">
                        <Gift
                          size={19}
                          className="text-[#B7E600]"
                        />
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider ${
                          unlocked
                            ? "bg-[#B7E600]/10 text-[#B7E600]"
                            : "bg-white/[0.05] text-white/30"
                        }`}
                      >
                        {unlocked
                          ? "Unlocked"
                          : "Locked"}
                      </span>
                    </div>

                    <h3 className="relative mt-5 text-base font-bold">
                      {offer.title}
                    </h3>

                    <p className="relative mt-2 text-xs leading-5 text-white/35">
                      {offer.description}
                    </p>

                    <div className="relative mt-5 flex items-end justify-between">
                      <span className="text-sm font-black text-[#B7E600]">
                        {offer.benefit}
                      </span>

                      <span className="text-[10px] font-semibold text-white/30">
                        {required} pts
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {/* Activity */}
        <section className="mt-7">
          <div className="mb-4">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#B7E600]/60">
              POINTS HISTORY
            </p>

            <h2 className="mt-1 text-xl font-black">
              Recent activity
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025]">
            {transactions.length === 0 ? (
              <div className="p-8 text-center">
                <Clock3
                  size={24}
                  className="mx-auto text-white/20"
                />

                <p className="mt-3 text-sm text-white/35">
                  No points activity yet.
                </p>
              </div>
            ) : (
              transactions.map(
                (transaction, index) => {
                  const amount = Number(
                    transaction.points || 0
                  )

                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{
                        opacity: 0,
                        x: -12,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        delay:
                          index * 0.05,
                      }}
                      className="flex items-center justify-between gap-4 border-b border-white/[0.05] p-4 last:border-none"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                          {amount >= 0 ? (
                            <Zap
                              size={16}
                              className="text-[#B7E600]"
                            />
                          ) : (
                            <Gift
                              size={16}
                              className="text-red-400"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {transaction.description ||
                              transaction.type ||
                              "Reward activity"}
                          </p>

                          <p className="mt-1 text-[9px] text-white/25">
                            {transaction.created_at
                              ? new Date(
                                  transaction.created_at
                                ).toLocaleDateString(
                                  "en-US",
                                  {
                                    month:
                                      "short",
                                    day: "numeric",
                                    year:
                                      "numeric",
                                  }
                                )
                              : "—"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 text-sm font-black ${
                          amount >= 0
                            ? "text-[#B7E600]"
                            : "text-red-400"
                        }`}
                      >
                        {amount >= 0
                          ? "+"
                          : ""}
                        {amount}
                      </span>
                    </motion.div>
                  )
                }
              )
            )}
          </div>
        </section>

        <div className="mt-7 flex items-center justify-center gap-2 pb-4 text-[9px] font-bold uppercase tracking-[0.17em] text-white/20">
          <Sparkles size={11} />
          Sportiva Member Progress System
          <Sparkles size={11} />
        </div>
      </main>
    </div>
  )
}

export default Rewards