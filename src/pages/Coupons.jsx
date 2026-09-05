import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  Edit3,
  Percent,
  Plus,
  RefreshCw,
  Search,
  TicketPercent,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Coupons.css";

const EMPTY_FORM = {
  code: "",
  title: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  min_booking_amount: "0",
  max_discount_amount: "",
  usage_limit: "",
  per_user_limit: "1",
  starts_at: "",
  expires_at: "",
  is_active: true,
};

function generateCouponCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SPORTIVA-";

  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

function formatDate(value) {
  if (!value) return "No expiry";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTimeInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);

  return local.toISOString().slice(0, 16);
}

function toISOStringOrNull(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function getCouponStatus(coupon) {
  const now = Date.now();

  if (!coupon.is_active) {
    return {
      label: "Inactive",
      className: "inactive",
    };
  }

  if (
    coupon.starts_at &&
    now < new Date(coupon.starts_at).getTime()
  ) {
    return {
      label: "Scheduled",
      className: "scheduled",
    };
  }

  if (
    coupon.expires_at &&
    now > new Date(coupon.expires_at).getTime()
  ) {
    return {
      label: "Expired",
      className: "expired",
    };
  }

  return {
    label: "Active",
    className: "active",
  };
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [usageCounts, setUsageCounts] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  function notify(text) {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 3500);
  }

  async function loadCoupons() {
    setLoading(true);

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load coupons error:", error);
      notify(error.message);
      setCoupons([]);
      setUsageCounts({});
      setLoading(false);
      return;
    }

    const couponList = data || [];

    setCoupons(couponList);

    const {
      data: usageData,
      error: usageError,
    } = await supabase
      .from("coupon_usages")
      .select("coupon_id");

    if (usageError) {
      console.error("Load coupon usage error:", usageError);
      setUsageCounts({});
    } else {
      const counts = {};

      for (const usage of usageData || []) {
        counts[usage.coupon_id] =
          (counts[usage.coupon_id] || 0) + 1;
      }

      setUsageCounts(counts);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  function openCreateForm() {
    setEditingCoupon(null);

    setForm({
      ...EMPTY_FORM,
      code: generateCouponCode(),
    });

    setShowForm(true);
  }

  function openEditForm(coupon) {
    setEditingCoupon(coupon);

    setForm({
      code: coupon.code || "",
      title: coupon.title || "",
      description: coupon.description || "",
      discount_type: coupon.discount_type || "percentage",
      discount_value:
        coupon.discount_value === null ||
        coupon.discount_value === undefined
          ? ""
          : String(coupon.discount_value),
      min_booking_amount:
        coupon.min_booking_amount === null ||
        coupon.min_booking_amount === undefined
          ? "0"
          : String(coupon.min_booking_amount),
      max_discount_amount:
        coupon.max_discount_amount === null ||
        coupon.max_discount_amount === undefined
          ? ""
          : String(coupon.max_discount_amount),
      usage_limit:
        coupon.usage_limit === null ||
        coupon.usage_limit === undefined
          ? ""
          : String(coupon.usage_limit),
      per_user_limit:
        coupon.per_user_limit === null ||
        coupon.per_user_limit === undefined
          ? "1"
          : String(coupon.per_user_limit),
      starts_at: formatDateTimeInput(coupon.starts_at),
      expires_at: formatDateTimeInput(coupon.expires_at),
      is_active: coupon.is_active ?? true,
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingCoupon(null);
    setForm(EMPTY_FORM);
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveCoupon(event) {
    event.preventDefault();

    const code = form.code.trim().toUpperCase();
    const discountValue = Number(form.discount_value);
    const minimumAmount = Number(
      form.min_booking_amount || 0
    );

    if (!code) {
      notify("Enter a coupon code.");
      return;
    }

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      notify("Enter a valid discount value.");
      return;
    }

    if (
      form.discount_type === "percentage" &&
      discountValue > 100
    ) {
      notify("Percentage discount cannot exceed 100%.");
      return;
    }

    if (!Number.isFinite(minimumAmount) || minimumAmount < 0) {
      notify("Minimum booking amount is invalid.");
      return;
    }

    if (
      form.usage_limit &&
      Number(form.usage_limit) < 1
    ) {
      notify("Usage limit must be at least 1.");
      return;
    }

    if (
      form.per_user_limit &&
      Number(form.per_user_limit) < 1
    ) {
      notify("Per-user limit must be at least 1.");
      return;
    }

    if (
      form.starts_at &&
      form.expires_at &&
      new Date(form.expires_at) <= new Date(form.starts_at)
    ) {
      notify("Expiry must be after the start date.");
      return;
    }

    setSaving(true);

    const {
      data: {
        user: currentUser,
      },
    } = await supabase.auth.getUser();

    const payload = {
      code,
      title: form.title.trim() || code,
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: discountValue,
      min_booking_amount: minimumAmount,
      max_discount_amount:
        form.discount_type === "percentage" &&
        form.max_discount_amount
          ? Number(form.max_discount_amount)
          : null,
      usage_limit: form.usage_limit
        ? Number(form.usage_limit)
        : null,
      per_user_limit: Number(form.per_user_limit || 1),
      starts_at: toISOStringOrNull(form.starts_at),
      expires_at: toISOStringOrNull(form.expires_at),
      is_active: Boolean(form.is_active),
    };

    let result;

    if (editingCoupon) {
      result = await supabase
        .from("coupons")
        .update(payload)
        .eq("id", editingCoupon.id);
    } else {
      result = await supabase
        .from("coupons")
        .insert([
          {
            ...payload,
            created_by: currentUser?.id || null,
          },
        ]);
    }

    if (result.error) {
      console.error("Save coupon error:", result.error);

      const text = result.error.message?.toLowerCase() || "";

      if (
        text.includes("duplicate") ||
        text.includes("unique")
      ) {
        notify("That coupon code already exists.");
      } else {
        notify(result.error.message);
      }

      setSaving(false);
      return;
    }

    setSaving(false);
    closeForm();

    notify(
      editingCoupon
        ? "Coupon updated successfully."
        : "Coupon created successfully."
    );

    await loadCoupons();
  }

  async function toggleCoupon(coupon) {
    const { error } = await supabase
      .from("coupons")
      .update({
        is_active: !coupon.is_active,
      })
      .eq("id", coupon.id);

    if (error) {
      console.error(error);
      notify(error.message);
      return;
    }

    notify(
      coupon.is_active
        ? "Coupon disabled."
        : "Coupon activated."
    );

    await loadCoupons();
  }

  async function deleteCoupon(coupon) {
    const confirmed = window.confirm(
      `Delete coupon "${coupon.code}"?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", coupon.id);

    if (error) {
      console.error(error);
      notify(error.message);
      return;
    }

    notify("Coupon deleted.");
    await loadCoupons();
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      notify(`${code} copied.`);
    } catch {
      notify("Could not copy coupon code.");
    }
  }

  const filteredCoupons = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return coupons;
    }

    return coupons.filter((coupon) => {
      return (
        coupon.code?.toLowerCase().includes(query) ||
        coupon.title?.toLowerCase().includes(query) ||
        coupon.description?.toLowerCase().includes(query)
      );
    });
  }, [coupons, search]);

  const activeCoupons = coupons.filter(
    (coupon) => coupon.is_active
  ).length;

  const totalUsage = Object.values(usageCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  return (
    <div className="coupons-page">
      <div className="coupons-shell">

        <header className="coupons-header">
          <div>
            <div className="coupons-eyebrow">
              THE SPORTIVA · ADMIN
            </div>

            <h1>Coupons</h1>

            <p>
              Create and manage promotional codes for turf
              bookings.
            </p>
          </div>

          <div className="coupons-header-actions">

            <button
              type="button"
              className="coupon-secondary-button"
              onClick={loadCoupons}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              className="coupon-primary-button"
              onClick={openCreateForm}
            >
              <Plus size={17} />
              Create Coupon
            </button>

          </div>
        </header>

        {message && (
          <div className="coupon-message">
            <Check size={16} />
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
            >
              <X size={15} />
            </button>
          </div>
        )}

        <section className="coupon-stats">

          <div className="coupon-stat-card">
            <div className="coupon-stat-icon">
              <TicketPercent size={19} />
            </div>

            <div>
              <span>Total Coupons</span>
              <strong>{coupons.length}</strong>
              <small>All promotional codes</small>
            </div>
          </div>

          <div className="coupon-stat-card">
            <div className="coupon-stat-icon">
              <Check size={19} />
            </div>

            <div>
              <span>Active Coupons</span>
              <strong>{activeCoupons}</strong>
              <small>Currently enabled</small>
            </div>
          </div>

          <div className="coupon-stat-card">
            <div className="coupon-stat-icon">
              <Percent size={19} />
            </div>

            <div>
              <span>Total Redemptions</span>
              <strong>{totalUsage}</strong>
              <small>Successful coupon uses</small>
            </div>
          </div>

        </section>

        <section className="coupon-toolbar">

          <div className="coupon-search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search code, title or description..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="coupon-results">
            {filteredCoupons.length}{" "}
            {filteredCoupons.length === 1
              ? "coupon"
              : "coupons"}
          </div>

        </section>

        <section className="coupon-table-card">

          {loading ? (
            <div className="coupon-empty-state">
              <RefreshCw
                size={24}
                className="coupon-spin"
              />
              <strong>Loading coupons...</strong>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="coupon-empty-state">

              <div className="coupon-empty-icon">
                <TicketPercent size={28} />
              </div>

              <strong>No coupons found</strong>

              <span>
                Create your first promotional code for
                Sportiva.
              </span>

              <button
                type="button"
                className="coupon-primary-button"
                onClick={openCreateForm}
              >
                <Plus size={16} />
                Create Coupon
              </button>

            </div>
          ) : (
            <div className="coupon-table-scroll">

              <table className="coupon-table">

                <thead>
                  <tr>
                    <th>Coupon</th>
                    <th>Discount</th>
                    <th>Usage</th>
                    <th>Validity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCoupons.map((coupon) => {
                    const usage =
                      usageCounts[coupon.id] || 0;

                    const status =
                      getCouponStatus(coupon);

                    return (
                      <tr key={coupon.id}>

                        <td>
                          <div className="coupon-code-cell">

                            <div className="coupon-code-icon">
                              <TicketPercent size={17} />
                            </div>

                            <div className="coupon-code-info">
                              <strong>
                                {coupon.code}
                              </strong>

                              <small>
                                {coupon.title ||
                                  "Sportiva promotion"}
                              </small>
                            </div>

                            <button
                              type="button"
                              className="coupon-copy"
                              onClick={() =>
                                copyCode(coupon.code)
                              }
                              title="Copy coupon"
                            >
                              <Copy size={14} />
                            </button>

                          </div>
                        </td>

                        <td>
                          <div className="coupon-discount-cell">

                            <strong>
                              {coupon.discount_type ===
                              "percentage"
                                ? `${Number(
                                    coupon.discount_value
                                  )}% OFF`
                                : `৳${Number(
                                    coupon.discount_value
                                  ).toLocaleString()} OFF`}
                            </strong>

                            {Number(
                              coupon.min_booking_amount || 0
                            ) > 0 && (
                              <small>
                                Min booking ৳
                                {Number(
                                  coupon.min_booking_amount
                                ).toLocaleString()}
                              </small>
                            )}

                          </div>
                        </td>

                        <td>
                          <div className="coupon-usage-cell">

                            <strong>{usage}</strong>

                            <span>
                              {coupon.usage_limit
                                ? ` / ${coupon.usage_limit}`
                                : " / Unlimited"}
                            </span>

                          </div>
                        </td>

                        <td>
                          <div className="coupon-date-cell">

                            <div>
                              <CalendarDays size={13} />

                              <span>
                                {coupon.starts_at
                                  ? formatDate(
                                      coupon.starts_at
                                    )
                                  : "Immediately"}
                              </span>
                            </div>

                            <div className="coupon-date-arrow">
                              →
                            </div>

                            <div>
                              <span>
                                {coupon.expires_at
                                  ? formatDate(
                                      coupon.expires_at
                                    )
                                  : "No expiry"}
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span
                            className={`coupon-status ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td>
                          <div className="coupon-actions">

                            <button
                              type="button"
                              className="coupon-action-button"
                              onClick={() =>
                                openEditForm(coupon)
                              }
                              title="Edit"
                            >
                              <Edit3 size={15} />
                            </button>

                            <button
                              type="button"
                              className="coupon-action-button"
                              onClick={() =>
                                toggleCoupon(coupon)
                              }
                              title={
                                coupon.is_active
                                  ? "Disable"
                                  : "Enable"
                              }
                            >
                              {coupon.is_active ? (
                                <X size={15} />
                              ) : (
                                <Check size={15} />
                              )}
                            </button>

                            <button
                              type="button"
                              className="coupon-action-button danger"
                              onClick={() =>
                                deleteCoupon(coupon)
                              }
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

              </table>

            </div>
          )}

        </section>
      </div>

      {showForm && (
        <div
          className="coupon-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              closeForm();
            }
          }}
        >

          <div className="coupon-modal">

            <div className="coupon-modal-header">

              <div>
                <span>
                  SPORTIVA PROMOTION SYSTEM
                </span>

                <h2>
                  {editingCoupon
                    ? "Edit Coupon"
                    : "Create Coupon"}
                </h2>
              </div>

              <button
                type="button"
                className="coupon-close"
                onClick={closeForm}
                disabled={saving}
              >
                <X size={18} />
              </button>

            </div>

            <form
              className="coupon-form"
              onSubmit={saveCoupon}
            >

              <div className="coupon-form-grid">

                <div className="coupon-field coupon-field-full">
                  <label>Coupon Code</label>

                  <div className="coupon-code-generator">

                    <input
                      type="text"
                      value={form.code}
                      onChange={(event) =>
                        updateForm(
                          "code",
                          event.target.value.toUpperCase()
                        )
                      }
                      placeholder="SPORTIVA-XXXXXX"
                      required
                    />

                    <button
                      type="button"
                      className="coupon-generate"
                      onClick={() =>
                        updateForm(
                          "code",
                          generateCouponCode()
                        )
                      }
                    >
                      Generate
                    </button>

                  </div>
                </div>

                <div className="coupon-field">
                  <label>Coupon Title</label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      updateForm(
                        "title",
                        event.target.value
                      )
                    }
                    placeholder="Weekend Special"
                  />
                </div>

                <div className="coupon-field">
                  <label>Discount Type</label>

                  <select
                    value={form.discount_type}
                    onChange={(event) =>
                      updateForm(
                        "discount_type",
                        event.target.value
                      )
                    }
                  >
                    <option value="percentage">
                      Percentage
                    </option>

                    <option value="fixed">
                      Fixed Amount
                    </option>
                  </select>
                </div>

                <div className="coupon-field">
                  <label>Discount Value</label>

                  <div className="coupon-input-with-symbol">

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discount_value}
                      onChange={(event) =>
                        updateForm(
                          "discount_value",
                          event.target.value
                        )
                      }
                      placeholder={
                        form.discount_type ===
                        "percentage"
                          ? "10"
                          : "300"
                      }
                      required
                    />

                    <span>
                      {form.discount_type ===
                      "percentage"
                        ? "%"
                        : "৳"}
                    </span>

                  </div>
                </div>

                <div className="coupon-field">
                  <label>
                    Minimum Booking Amount
                  </label>

                  <div className="coupon-input-with-symbol">

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.min_booking_amount}
                      onChange={(event) =>
                        updateForm(
                          "min_booking_amount",
                          event.target.value
                        )
                      }
                    />

                    <span>৳</span>

                  </div>
                </div>

                <div className="coupon-field">
                  <label>
                    Maximum Discount
                  </label>

                  <div className="coupon-input-with-symbol">

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.max_discount_amount}
                      onChange={(event) =>
                        updateForm(
                          "max_discount_amount",
                          event.target.value
                        )
                      }
                      disabled={
                        form.discount_type !==
                        "percentage"
                      }
                      placeholder={
                        form.discount_type ===
                        "percentage"
                          ? "Optional"
                          : "Not required"
                      }
                    />

                    <span>৳</span>

                  </div>
                </div>

                <div className="coupon-field">
                  <label>
                    Total Usage Limit
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.usage_limit}
                    onChange={(event) =>
                      updateForm(
                        "usage_limit",
                        event.target.value
                      )
                    }
                    placeholder="Unlimited"
                  />
                </div>

                <div className="coupon-field">
                  <label>
                    Usage Per User
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.per_user_limit}
                    onChange={(event) =>
                      updateForm(
                        "per_user_limit",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="coupon-field">
                  <label>Starts At</label>

                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(event) =>
                      updateForm(
                        "starts_at",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="coupon-field">
                  <label>Expires At</label>

                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(event) =>
                      updateForm(
                        "expires_at",
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="coupon-field coupon-field-full">
                  <label>Description</label>

                  <textarea
                    rows="3"
                    value={form.description}
                    onChange={(event) =>
                      updateForm(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Describe this promotion..."
                  />
                </div>

              </div>

              <label className="coupon-active-option">

                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    updateForm(
                      "is_active",
                      event.target.checked
                    )
                  }
                />

                <span>
                  <strong>
                    Coupon is active
                  </strong>

                  <small>
                    Customers can use this coupon while
                    it is active and within its validity
                    period.
                  </small>
                </span>

              </label>

              <div className="coupon-form-footer">

                <button
                  type="button"
                  className="coupon-secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="coupon-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="coupon-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      {editingCoupon
                        ? "Save Changes"
                        : "Create Coupon"}
                    </>
                  )}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}