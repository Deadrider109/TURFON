import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock3,
  Gift,
  RefreshCw,
  Star,
  Trophy,
} from "lucide-react"

import { supabase } from "../lib/supabase"

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
          Number(checkpoint.points_required) > points
      ) || null
    )
  }, [checkpoints, points])

  const previousCheckpoint = useMemo(() => {
    const reached = checkpoints.filter(
      (checkpoint) =>
        Number(checkpoint.points_required) <= points
    )

    return reached[reached.length - 1] || null
  }, [checkpoints, points])

  const progress = useMemo(() => {
    if (!nextCheckpoint) return 100

    const currentRequired = previousCheckpoint
      ? Number(previousCheckpoint.points_required)
      : 0

    const nextRequired = Number(
      nextCheckpoint.points_required
    )

    const range = nextRequired - currentRequired

    if (range <= 0) return 100

    const currentProgress =
      ((points - currentRequired) / range) * 100

    return Math.max(0, Math.min(100, currentProgress))
  }, [nextCheckpoint, points, previousCheckpoint])

  const pointsToNext = nextCheckpoint
    ? Math.max(
        0,
        Number(nextCheckpoint.points_required) - points
      )
    : 0

  const status =
    rewardData?.title ||
    previousCheckpoint?.title ||
    "Starter"

  const description =
    rewardData?.description ||
    previousCheckpoint?.description ||
    "Keep booking and earning points to unlock Sportiva rewards."

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7F3] dark:bg-[#0B110E]">
        <div className="flex items-center gap-3 text-[#123B27] dark:text-white">
          <RefreshCw size={18} className="animate-spin" />
          <span className="text-sm font-medium">
            Loading rewards...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F6F7F3] text-[#123B27] dark:bg-[#0B110E] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[#F6F7F3]/90 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0B110E]/90">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-bold text-black/60 transition hover:text-[#123B27] dark:text-white/60 dark:hover:text-white"
          >
            <ArrowLeft size={17} />
            Dashboard
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadRewards(true)}
              disabled={refreshing}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#123B27] transition hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white"
              aria-label="Refresh rewards"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 dark:text-white/30">
            Sportiva Rewards
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            Your progress
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-black/50 dark:text-white/45">
            Earn points from your Sportiva activity and unlock
            better member benefits.
          </p>
        </section>

        <section
          className="
            overflow-hidden rounded-3xl
            bg-[#123B27]
            p-6 text-white
            shadow-[0_18px_60px_rgba(18,59,39,0.2)]
            sm:p-8
          "
        >
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Trophy size={23} className="text-[#B7E600]" />
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-white/45">
                    CURRENT STATUS
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    {status}
                  </h2>
                </div>
              </div>

              <p className="mt-5 max-w-md text-sm leading-6 text-white/60">
                {description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
                    CURRENT POINTS
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {points}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">
                    LIFETIME POINTS
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {lifetimePoints}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">
                    NEXT MILESTONE
                  </p>

                  <h3 className="mt-1 text-lg font-black">
                    {nextCheckpoint?.title ||
                      "Maximum level reached"}
                  </h3>
                </div>

                {nextCheckpoint && (
                  <span className="text-sm font-bold text-[#B7E600]">
                    {pointsToNext} pts left
                  </span>
                )}
              </div>

              <div className="mt-6">
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#B7E600] transition-all duration-700"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-[10px] font-semibold text-white/40">
                  <span>
                    {previousCheckpoint?.points_required || 0} pts
                  </span>

                  <span>
                    {nextCheckpoint?.points_required || points} pts
                  </span>
                </div>
              </div>

              {nextCheckpoint?.description && (
                <p className="mt-5 text-xs leading-5 text-white/50">
                  {nextCheckpoint.description}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.04]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B27]/[0.08] dark:bg-[#B7E600]/10">
              <Star
                size={18}
                className="text-[#123B27] dark:text-[#B7E600]"
              />
            </div>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-black/35 dark:text-white/30">
              Current Points
            </p>

            <p className="mt-1 text-3xl font-black">
              {points}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.04]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B27]/[0.08] dark:bg-[#B7E600]/10">
              <Award
                size={18}
                className="text-[#123B27] dark:text-[#B7E600]"
              />
            </div>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-black/35 dark:text-white/30">
              Member Status
            </p>

            <p className="mt-1 text-xl font-black">
              {status}
            </p>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.04]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B27]/[0.08] dark:bg-[#B7E600]/10">
              <CheckCircle2
                size={18}
                className="text-[#123B27] dark:text-[#B7E600]"
              />
            </div>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-black/35 dark:text-white/30">
              Next Target
            </p>

            <p className="mt-1 text-xl font-black">
              {nextCheckpoint
                ? `${nextCheckpoint.points_required} pts`
                : "Completed"}
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B27]/[0.08] dark:bg-[#B7E600]/10">
                <Gift
                  size={18}
                  className="text-[#123B27] dark:text-[#B7E600]"
                />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/35 dark:text-white/30">
                  AVAILABLE BENEFITS
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Rewards you can unlock
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {offers.length === 0 ? (
                <div className="rounded-xl bg-black/[0.025] p-4 dark:bg-white/[0.035]">
                  <p className="text-sm text-black/45 dark:text-white/40">
                    No active rewards are available right now.
                  </p>
                </div>
              ) : (
                offers.map((offer) => {
                  const required = Number(
                    offer.required_points || 0
                  )

                  const unlocked = points >= required

                  return (
                    <div
                      key={offer.id}
                      className="rounded-2xl border border-black/[0.06] p-4 dark:border-white/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold">
                            {offer.title}
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-black/45 dark:text-white/40">
                            {offer.description}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${
                            unlocked
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-black/[0.04] text-black/40 dark:bg-white/[0.05] dark:text-white/35"
                          }`}
                        >
                          {unlocked ? "Unlocked" : "Locked"}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-[#123B27] dark:text-[#B7E600]">
                          {offer.benefit}
                        </span>

                        <span className="text-black/40 dark:text-white/35">
                          {required} points
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123B27]/[0.08] dark:bg-[#B7E600]/10">
                <Clock3
                  size={18}
                  className="text-[#123B27] dark:text-[#B7E600]"
                />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/35 dark:text-white/30">
                  ACTIVITY
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Recent points history
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-1">
              {transactions.length === 0 ? (
                <div className="rounded-xl bg-black/[0.025] p-4 dark:bg-white/[0.035]">
                  <p className="text-sm text-black/45 dark:text-white/40">
                    No reward activity yet.
                  </p>
                </div>
              ) : (
                transactions.map((transaction) => {
                  const positive =
                    Number(transaction.points || 0) >= 0

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between gap-4 border-b border-black/[0.05] py-3 last:border-none dark:border-white/[0.05]"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {transaction.description ||
                            transaction.type ||
                            "Reward activity"}
                        </p>

                        <p className="mt-1 text-[10px] text-black/35 dark:text-white/30">
                          {transaction.created_at
                            ? new Date(
                                transaction.created_at
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </p>
                      </div>

                      <span
                        className={`text-sm font-black ${
                          positive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-500"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {Number(transaction.points || 0)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 rounded-2xl border border-dashed border-black/10 p-5 dark:border-white/10">
          <p className="text-center text-xs leading-5 text-black/40 dark:text-white/35">
            Keep playing, keep booking, and keep earning. Your
            Sportiva points grow with your activity.
          </p>
        </div>
      </main>
    </div>
  )
}

export default Rewards