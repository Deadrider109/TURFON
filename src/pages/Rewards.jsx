import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Award,
  Check,
  Gift,
  History,
  RefreshCw,
  Star,
  Trophy,
  Zap,
} from "lucide-react"

import { supabase } from "../lib/supabase"

function AnimatedNumber({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const target = Number(value || 0)

    if (!Number.isFinite(target)) {
      setDisplay(0)
      return
    }

    const startValue = 0
    const startTime = performance.now()
    let frameId

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const eased = 1 - Math.pow(1 - progress, 3)
      const currentValue =
        startValue + (target - startValue) * eased

      setDisplay(Math.round(currentValue))

      if (progress < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }

    frameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frameId)
  }, [value, duration])

  return display.toLocaleString("en-BD")
}

function formatActivityDate(value) {
  if (!value) return "—"

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
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
          .limit(12),

        supabase
          .from("community_offers")
          .select("*")
          .eq("is_active", true)
          .order("required_points", {
            ascending: true,
          }),
      ])

      if (rewardResult.error) {
        console.error("Reward data error:", rewardResult.error)
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
        console.error("Offers error:", offersResult.error)
      }

      let reward = rewardResult.data

      if (Array.isArray(reward)) {
        reward = reward[0] || null
      }

      setRewardData(reward || null)
      setCheckpoints(checkpointsResult.data || [])
      setTransactions(transactionsResult.data || [])
      setOffers(offersResult.data || [])
    } catch (error) {
      console.error("Rewards page error:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadRewards()
  }, [])

  const points = Number(rewardData?.points || 0)

  const lifetimePoints = Number(
    rewardData?.lifetime_points || 0
  )

  const nextCheckpoint = useMemo(() => {
    return (
      checkpoints.find(
        (checkpoint) =>
          Number(checkpoint.points_required || 0) > points
      ) || null
    )
  }, [checkpoints, points])

  const reachedCheckpoints = useMemo(() => {
    return checkpoints.filter(
      (checkpoint) =>
        Number(checkpoint.points_required || 0) <= points
    )
  }, [checkpoints, points])

  const currentCheckpoint =
    reachedCheckpoints[reachedCheckpoints.length - 1] || null

  const progress = useMemo(() => {
    if (!nextCheckpoint) return 100

    const currentRequired = currentCheckpoint
      ? Number(currentCheckpoint.points_required || 0)
      : 0

    const nextRequired = Number(
      nextCheckpoint.points_required || 0
    )

    const range = nextRequired - currentRequired

    if (range <= 0) return 100

    return Math.max(
      0,
      Math.min(
        100,
        ((points - currentRequired) / range) * 100
      )
    )
  }, [currentCheckpoint, nextCheckpoint, points])

  const pointsToNext = nextCheckpoint
    ? Math.max(
        0,
        Number(nextCheckpoint.points_required || 0) - points
      )
    : 0

  const currentStatus =
    rewardData?.title ||
    currentCheckpoint?.title ||
    "Starter"

  const currentDescription =
    rewardData?.description ||
    currentCheckpoint?.description ||
    "Keep playing and earning points to unlock more Sportiva benefits."

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7F3] text-[#123B27] dark:bg-[#0B110E] dark:text-white">
        <div className="flex items-center gap-3">
          <RefreshCw
            size={18}
            className="animate-spin text-[#28734A]"
          />

          <span className="text-sm font-medium">
            Loading rewards...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F6F7F3] text-[#123B27] dark:bg-[#0B110E] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#F6F7F3]/95 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0B110E]/95">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-2 text-sm font-semibold text-black/55 transition hover:text-[#123B27] dark:text-white/55 dark:hover:text-white"
          >
            <ArrowLeft
              size={17}
              className="transition group-hover:-translate-x-0.5"
            />

            Back to Dashboard
          </button>

          <button
            type="button"
            onClick={() => loadRewards(true)}
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.07] bg-white text-[#123B27] shadow-sm transition hover:border-[#28734A]/20 hover:bg-[#F5F8F5] disabled:opacity-50 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.07]"
            aria-label="Refresh rewards"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        {/* Page heading */}
        <section className="mb-7">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#28734A]" />

            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#28734A] dark:text-[#B7E600]">
              SPORTIVA REWARDS
            </p>
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Your member journey
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-black/45 dark:text-white/40">
            Track your points, membership status and the rewards
            you've unlocked through Sportiva.
          </p>
        </section>

        {/* Main membership card */}
        <section className="overflow-hidden rounded-[26px] border border-[#123B27]/10 bg-white shadow-[0_18px_60px_rgba(18,59,39,0.08)] dark:border-white/[0.07] dark:bg-white/[0.035]">
          <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
            {/* Status section */}
            <div className="relative overflow-hidden bg-[#123B27] p-6 text-white sm:p-8">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/[0.08]" />
              <div className="absolute -right-5 -top-5 h-26 w-26 rounded-full border border-[#B7E600]/10" />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#B7E600]/15 bg-[#B7E600]/10">
                    <Trophy
                      size={22}
                      className="text-[#B7E600]"
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                      MEMBERSHIP STATUS
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      {currentStatus}
                    </h2>
                  </div>
                </div>

                <p className="mt-6 max-w-sm text-sm leading-6 text-white/55">
                  {currentDescription}
                </p>

                <div className="mt-7">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
                    CURRENT POINTS
                  </p>

                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-5xl font-black tracking-[-0.05em] text-[#B7E600]">
                      <AnimatedNumber value={points} />
                    </span>

                    <span className="mb-1 text-xs font-semibold text-white/35">
                      points
                    </span>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4">
                    <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/30">
                      LIFETIME
                    </p>

                    <p className="mt-2 text-xl font-black">
                      <AnimatedNumber
                        value={lifetimePoints}
                      />
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4">
                    <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/30">
                      NEXT TARGET
                    </p>

                    <p className="mt-2 text-xl font-black">
                      {nextCheckpoint
                        ? Number(
                            nextCheckpoint.points_required
                          ).toLocaleString()
                        : "MAX"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress section */}
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.17em] text-[#28734A] dark:text-[#B7E600]">
                    PROGRESSION
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    {nextCheckpoint
                      ? `Next: ${nextCheckpoint.title}`
                      : "All milestones reached"}
                  </h2>
                </div>

                <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#123B27]/[0.06] sm:flex dark:bg-[#B7E600]/10">
                  <Zap
                    size={18}
                    className="text-[#28734A] dark:text-[#B7E600]"
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-black">
                      {Math.round(progress)}%
                    </p>

                    <p className="mt-1 text-xs text-black/40 dark:text-white/35">
                      milestone progress
                    </p>
                  </div>

                  {nextCheckpoint && (
                    <p className="text-right text-xs font-semibold text-black/40 dark:text-white/35">
                      {pointsToNext} points to go
                    </p>
                  )}
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#123B27]/[0.07] dark:bg-white/[0.07]">
                  <div
                    className="h-full rounded-full bg-[#28734A] transition-all duration-1000 ease-out dark:bg-[#B7E600]"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-[9px] font-semibold text-black/30 dark:text-white/25">
                  <span>
                    {currentCheckpoint
                      ? `${Number(
                          currentCheckpoint.points_required
                        ).toLocaleString()} pts`
                      : "0 pts"}
                  </span>

                  <span>
                    {nextCheckpoint
                      ? `${Number(
                          nextCheckpoint.points_required
                        ).toLocaleString()} pts`
                      : `${points.toLocaleString()} pts`}
                  </span>
                </div>
              </div>

              {nextCheckpoint && (
                <div className="mt-8 rounded-2xl border border-[#123B27]/[0.07] bg-[#F7F9F7] p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#123B27]/[0.07] text-[#28734A] dark:bg-[#B7E600]/10 dark:text-[#B7E600]">
                      <Award size={16} />
                    </div>

                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-black/30 dark:text-white/25">
                        NEXT MILESTONE
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {nextCheckpoint.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-black/40 dark:text-white/35">
                        {nextCheckpoint.description ||
                          `Reach ${nextCheckpoint.points_required} points to unlock this milestone.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_8px_30px_rgba(18,59,39,0.04)] dark:border-white/[0.07] dark:bg-white/[0.035]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B27]/[0.07] dark:bg-[#B7E600]/10">
              <Star
                size={18}
                className="text-[#28734A] dark:text-[#B7E600]"
              />
            </div>

            <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.15em] text-black/30 dark:text-white/25">
              Current points
            </p>

            <p className="mt-1 text-2xl font-black">
              <AnimatedNumber value={points} />
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_8px_30px_rgba(18,59,39,0.04)] dark:border-white/[0.07] dark:bg-white/[0.035]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B27]/[0.07] dark:bg-[#B7E600]/10">
              <Trophy
                size={18}
                className="text-[#28734A] dark:text-[#B7E600]"
              />
            </div>

            <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.15em] text-black/30 dark:text-white/25">
              Member status
            </p>

            <p className="mt-1 text-2xl font-black">
              {currentStatus}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_8px_30px_rgba(18,59,39,0.04)] dark:border-white/[0.07] dark:bg-white/[0.035]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B27]/[0.07] dark:bg-[#B7E600]/10">
              <Award
                size={18}
                className="text-[#28734A] dark:text-[#B7E600]"
              />
            </div>

            <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.15em] text-black/30 dark:text-white/25">
              Next milestone
            </p>

            <p className="mt-1 text-2xl font-black">
              {nextCheckpoint
                ? Number(
                    nextCheckpoint.points_required
                  ).toLocaleString()
                : "Complete"}
            </p>
          </div>
        </section>

        {/* Milestones */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#28734A] dark:text-[#B7E600]">
              MEMBER JOURNEY
            </p>

            <h2 className="mt-1 text-xl font-black">
              Membership milestones
            </h2>
          </div>

          {checkpoints.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
              <Award
                size={24}
                className="mx-auto text-black/20 dark:text-white/20"
              />

              <p className="mt-3 text-sm text-black/40 dark:text-white/35">
                No milestones have been configured yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {checkpoints.map((checkpoint, index) => {
                const required = Number(
                  checkpoint.points_required || 0
                )

                const unlocked = points >= required

                return (
                  <div
                    key={checkpoint.id}
                    className={`relative overflow-hidden rounded-2xl border p-5 transition ${
                      unlocked
                        ? "border-[#28734A]/15 bg-white shadow-[0_8px_30px_rgba(18,59,39,0.04)] dark:border-[#B7E600]/15 dark:bg-white/[0.035]"
                        : "border-black/[0.07] bg-white dark:border-white/[0.07] dark:bg-white/[0.025]"
                    }`}
                  >
                    {unlocked && (
                      <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-[#28734A]/[0.035] dark:bg-[#B7E600]/[0.035]" />
                    )}

                    <div className="relative flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          unlocked
                            ? "bg-[#28734A] text-white dark:bg-[#B7E600] dark:text-[#123B27]"
                            : "bg-black/[0.04] text-black/25 dark:bg-white/[0.05] dark:text-white/25"
                        }`}
                      >
                        {unlocked ? (
                          <Check size={18} />
                        ) : (
                          <Award size={18} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-bold">
                            {checkpoint.title}
                          </h3>

                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider ${
                              unlocked
                                ? "text-[#28734A] dark:text-[#B7E600]"
                                : "text-black/30 dark:text-white/25"
                            }`}
                          >
                            {unlocked
                              ? "Unlocked"
                              : `${required} pts`}
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-black/40 dark:text-white/35">
                          {checkpoint.description ||
                            "Sportiva membership milestone"}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Rewards */}
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#28734A] dark:text-[#B7E600]">
              BENEFITS
            </p>

            <h2 className="mt-1 text-xl font-black">
              Available rewards
            </h2>

            <p className="mt-1 text-xs text-black/40 dark:text-white/35">
              Unlock more benefits as your points grow.
            </p>
          </div>

          {offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
              <Gift
                size={24}
                className="mx-auto text-black/20 dark:text-white/20"
              />

              <p className="mt-3 text-sm text-black/40 dark:text-white/35">
                No rewards are currently available.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => {
                const required = Number(
                  offer.required_points || 0
                )

                const unlocked = points >= required

                return (
                  <div
                    key={offer.id}
                    className={`rounded-2xl border bg-white p-5 shadow-[0_8px_30px_rgba(18,59,39,0.04)] transition hover:-translate-y-1 dark:bg-white/[0.035] ${
                      unlocked
                        ? "border-[#28734A]/15 dark:border-[#B7E600]/15"
                        : "border-black/[0.07] dark:border-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B27]/[0.07] dark:bg-[#B7E600]/10">
                        <Gift
                          size={17}
                          className="text-[#28734A] dark:text-[#B7E600]"
                        />
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider ${
                          unlocked
                            ? "bg-[#28734A]/10 text-[#28734A] dark:bg-[#B7E600]/10 dark:text-[#B7E600]"
                            : "bg-black/[0.04] text-black/35 dark:bg-white/[0.05] dark:text-white/30"
                        }`}
                      >
                        {unlocked
                          ? "Unlocked"
                          : "Locked"}
                      </span>
                    </div>

                    <h3 className="mt-5 text-base font-bold">
                      {offer.title}
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-black/40 dark:text-white/35">
                      {offer.description}
                    </p>

                    <div className="mt-5 border-t border-black/[0.06] pt-4 dark:border-white/[0.06]">
                      <div className="flex items-end justify-between gap-3">
                        <span className="text-sm font-black text-[#28734A] dark:text-[#B7E600]">
                          {offer.benefit}
                        </span>

                        <span className="text-[10px] font-semibold text-black/30 dark:text-white/25">
                          {required} pts
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Activity */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#28734A] dark:text-[#B7E600]">
                HISTORY
              </p>

              <h2 className="mt-1 text-xl font-black">
                Recent points activity
              </h2>
            </div>

            <History
              size={19}
              className="text-black/20 dark:text-white/20"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_8px_30px_rgba(18,59,39,0.04)] dark:border-white/[0.07] dark:bg-white/[0.035]">
            {transactions.length === 0 ? (
              <div className="p-8 text-center">
                <History
                  size={24}
                  className="mx-auto text-black/20 dark:text-white/20"
                />

                <p className="mt-3 text-sm text-black/40 dark:text-white/35">
                  No points activity yet.
                </p>
              </div>
            ) : (
              transactions.map((transaction) => {
                const amount = Number(
                  transaction.points || 0
                )

                const positive = amount >= 0

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 border-b border-black/[0.05] px-4 py-4 last:border-none sm:px-5 dark:border-white/[0.05]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          positive
                            ? "bg-[#28734A]/10 text-[#28734A] dark:bg-[#B7E600]/10 dark:text-[#B7E600]"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {positive ? (
                          <Zap size={16} />
                        ) : (
                          <Gift size={16} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {transaction.description ||
                            transaction.type ||
                            "Reward activity"}
                        </p>

                        <p className="mt-1 text-[9px] text-black/30 dark:text-white/25">
                          {formatActivityDate(
                            transaction.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-sm font-black ${
                        positive
                          ? "text-[#28734A] dark:text-[#B7E600]"
                          : "text-red-500"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {amount}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <footer className="mt-8 border-t border-black/[0.06] py-5 text-center text-[9px] font-bold uppercase tracking-[0.15em] text-black/25 dark:border-white/[0.06] dark:text-white/20">
          Sportiva Membership & Rewards
        </footer>
      </main>
    </div>
  )
}

export default Rewards