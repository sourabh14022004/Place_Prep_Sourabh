"use client";

import Link from "next/link";
import { useState } from "react";

/* ══════════════════════════════════════════════════════════════
   Design-system primitives — the ONLY sanctioned building blocks.
   One card language, one header pattern, one empty state.
   ══════════════════════════════════════════════════════════════ */

/** Deterministic gradient pair from any string — letter avatars always look branded. */
function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

const COMPANY_DOMAIN_MAP: Record<string, string> = {
  "1kosmos": "1kosmos.com",
  "6sense": "6sense.com",
  "accelya": "accelya.com",
  "accenture": "accenture.com",
  "accolite": "accolitedigital.com",
  "acko": "acko.com",
  "acorns": "acorns.com",
  "activision": "activision.com",
  "adobe": "adobe.com",
  "adp": "adp.com",
  "aetion": "aetion.com",
  "affinity": "affinity.co",
  "affirm": "affirm.com",
  "agoda": "agoda.com",
  "airbnb": "airbnb.com",
  "airbus": "airbus.com",
  "airtel": "airtel.in",
  "amazon": "amazon.com",
  "amd": "amd.com",
  "american-express": "americanexpress.com",
  "american express": "americanexpress.com",
  "apple": "apple.com",
  "applied-materials": "appliedmaterials.com",
  "arista": "arista.com",
  "atlassian": "atlassian.com",
  "bain": "bain.com",
  "barclays": "barclays.com",
  "bcg": "bcg.com",
  "blinkit": "blinkit.com",
  "bny-mellon": "bnymellon.com",
  "bny mellon": "bnymellon.com",
  "bnymellon": "bnymellon.com",
  "booking": "booking.com",
  "booking.com": "booking.com",
  "byju": "byjus.com",
  "byjus": "byjus.com",
  "capgemini": "capgemini.com",
  "cisco": "cisco.com",
  "citadel": "citadel.com",
  "citigroup": "citigroup.com",
  "citi": "citi.com",
  "cloudflare": "cloudflare.com",
  "cohesity": "cohesity.com",
  "coinbase": "coinbase.com",
  "cred": "cred.club",
  "credit-suisse": "credit-suisse.com",
  "crowdstrike": "crowdstrike.com",
  "curefit": "cult.fit",
  "cultfit": "cult.fit",
  "databricks": "databricks.com",
  "de-shaw": "deshaw.com",
  "d.e. shaw": "deshaw.com",
  "deshaw": "deshaw.com",
  "deloitte": "deloitte.com",
  "deutsche-bank": "db.com",
  "deutsche bank": "db.com",
  "door-dash": "doordash.com",
  "doordash": "doordash.com",
  "dropbox": "dropbox.com",
  "duolingo": "duolingo.com",
  "ea": "ea.com",
  "ebay": "ebay.com",
  "epic-games": "epicgames.com",
  "epic games": "epicgames.com",
  "expedia": "expedia.com",
  "ey": "ey.com",
  "flipkart": "flipkart.com",
  "gitlab": "gitlab.com",
  "github": "github.com",
  "goldman-sachs": "goldmansachs.com",
  "goldman sachs": "goldmansachs.com",
  "goldmansachs": "goldmansachs.com",
  "google": "google.com",
  "grab": "grab.com",
  "hcl": "hcltech.com",
  "hcltech": "hcltech.com",
  "hubspot": "hubspot.com",
  "ibm": "ibm.com",
  "infosys": "infosys.com",
  "intel": "intel.com",
  "intuit": "intuit.com",
  "jane-street": "janestreet.com",
  "jane street": "janestreet.com",
  "jpmorgan": "jpmorgan.com",
  "jp-morgan": "jpmorgan.com",
  "jp morgan": "jpmorgan.com",
  "jpmorgan chase": "jpmorgan.com",
  "kpmg": "kpmg.com",
  "linkedin": "linkedin.com",
  "lyft": "lyft.com",
  "mastercard": "mastercard.com",
  "mathworks": "mathworks.com",
  "mckinsey": "mckinsey.com",
  "media-net": "media.net",
  "media.net": "media.net",
  "meta": "meta.com",
  "microsoft": "microsoft.com",
  "morgan-stanley": "morganstanley.com",
  "morgan stanley": "morganstanley.com",
  "motorola": "motorola.com",
  "myntra": "myntra.com",
  "netflix": "netflix.com",
  "nike": "nike.com",
  "notion": "notion.so",
  "nutanix": "nutanix.com",
  "nvidia": "nvidia.com",
  "nykaa": "nykaa.com",
  "ola": "olacabs.com",
  "oracle": "oracle.com",
  "palantir": "palantir.com",
  "paytm": "paytm.com",
  "paypal": "paypal.com",
  "phonepe": "phonepe.com",
  "pinterest": "pinterest.com",
  "postman": "postman.com",
  "pwc": "pwc.com",
  "qualcomm": "qualcomm.com",
  "razorpay": "razorpay.com",
  "reddit": "reddit.com",
  "rippling": "rippling.com",
  "robinhood": "robinhood.com",
  "rubrik": "rubrik.com",
  "salesforce": "salesforce.com",
  "samsung": "samsung.com",
  "sap": "sap.com",
  "servicenow": "servicenow.com",
  "shopify": "shopify.com",
  "slack": "slack.com",
  "snap": "snap.com",
  "snowflake": "snowflake.com",
  "spotify": "spotify.com",
  "square": "squareup.com",
  "stripe": "stripe.com",
  "swiggy": "swiggy.com",
  "target": "target.com",
  "tcs": "tata.com",
  "tata": "tata.com",
  "tata consultancy services": "tata.com",
  "tech-mahindra": "techmahindra.com",
  "tech mahindra": "techmahindra.com",
  "tesla": "tesla.com",
  "tiktok": "tiktok.com",
  "thoughtworks": "thoughtworks.com",
  "twillio": "twilio.com",
  "twilio": "twilio.com",
  "twitter": "twitter.com",
  "uber": "uber.com",
  "visa": "visa.com",
  "vmware": "vmware.com",
  "walmart": "walmart.com",
  "wells-fargo": "wellsfargo.com",
  "wells fargo": "wellsfargo.com",
  "wipro": "wipro.com",
  "yandex": "yandex.com",
  "zappos": "zappos.com",
  "zepto": "zeptonow.com",
  "zillow": "zillow.com",
  "zoho": "zoho.com",
  "zomato": "zomato.com",
  "zynga": "zynga.com",
  "netcracker": "netcracker.com",
  "netcracker technology": "netcracker.com",
  "netcracker-technology": "netcracker.com",
};

function resolveCompanyDomain(name: string): string {
  const norm = (name || "").toLowerCase().trim();
  if (COMPANY_DOMAIN_MAP[norm]) return COMPANY_DOMAIN_MAP[norm];
  const slug = norm.replace(/[\s_]+/g, "-");
  if (COMPANY_DOMAIN_MAP[slug]) return COMPANY_DOMAIN_MAP[slug];
  if (norm.includes(".")) return norm;
  const alphanumeric = norm.replace(/[^a-z0-9]/g, "");
  return `${alphanumeric}.com`;
}

/**
 * CompanyLogo — REAL company logo via high-res Google Favicon API, with a
 * deterministic brand-gradient letter avatar as graceful fallback.
 */
export function CompanyLogo({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const hue = hashHue((name || "").toLowerCase());
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const domain = resolveCompanyDomain(name);
  const iconSize = 128;

  if (!failed && domain) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${iconSize}`}
        alt={`${name} logo`}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-xl object-contain bg-white border border-gray-200/80 shadow-sm p-1.5 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`relative shrink-0 overflow-hidden rounded-xl flex items-center justify-center font-black text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, hsl(${hue} 72% 52%), hsl(${(hue + 40) % 360} 70% 44%))`,
      }}
    >
      {/* subtle inner highlight */}
      <span className="absolute inset-x-0 top-0 h-1/2 bg-white/15" />
      <span className="relative">{initial}</span>
    </div>
  );
}

/**
 * Overlapping company logos, for anything covering more than one company —
 * a custom roadmap may span Adobe, Airbnb and Amazon at once, where the
 * company cards elsewhere only ever show a single logo.
 *
 * Falls back to a neutral icon slot when a plan has no company questions at
 * all (an entirely external/LeetCode roadmap), so the row keeps its rhythm.
 */
export function CompanyLogoStack({
  names,
  size = 28,
  max = 3,
  className = "",
}: {
  names: string[];
  size?: number;
  max?: number;
  className?: string;
}) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  // Overlap by ~a third so each logo stays recognisable.
  const overlap = Math.round(size / 3);

  return (
    <div className={`flex items-center shrink-0 ${className}`}>
      {shown.map((name, i) => (
        <div
          key={`${name}-${i}`}
          className="rounded-xl ring-2 ring-white"
          style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: shown.length - i }}
          title={name}
        >
          <CompanyLogo name={name} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="rounded-xl ring-2 ring-white bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-600 shrink-0"
          style={{ width: size, height: size, marginLeft: -overlap, fontSize: size * 0.34 }}
          title={names.slice(max).join(", ")}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

/** Official platform logos with pixel-perfect vector and crisp brand icons. */
export function PlatformLogo({
  platform,
  size = 42,
  className = "",
}: {
  platform: string;
  size?: number;
  className?: string;
}) {
  const p = (platform || "").toLowerCase().trim();

  if (p === "leetcode") {
    return (
      <div
        className={`shrink-0 flex items-center justify-center rounded-xl bg-[#FFF8F0] border border-[#FFE8D6] p-0.5 shadow-sm overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/leetcode.png"
          alt="LeetCode logo"
          className="w-full h-full object-contain scale-[1.4] transform"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "https://image.pngaaa.com/118/4868118-middle.png";
          }}
        />
      </div>
    );
  }

  if (p === "codeforces") {
    return (
      <div
        className={`shrink-0 flex items-center justify-center rounded-xl bg-[#F0F6FF] border border-[#D6E6FE] p-1.5 shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
          <rect x="2.5" y="9.5" width="4.5" height="11.5" rx="1.5" fill="#FFD400" />
          <rect x="9.75" y="3.5" width="4.5" height="17.5" rx="1.5" fill="#2172C3" />
          <rect x="17" y="6.5" width="4.5" height="14.5" rx="1.5" fill="#C70000" />
        </svg>
      </div>
    );
  }

  if (p === "geeksforgeeks" || p === "gfg") {
    return (
      <div
        className={`shrink-0 flex items-center justify-center rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] p-1 shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src="https://www.google.com/s2/favicons?domain=geeksforgeeks.org&sz=128"
          alt="GeeksforGeeks logo"
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
    );
  }

  if (p === "hackerrank") {
    return (
      <div
        className={`shrink-0 flex items-center justify-center rounded-xl bg-[#00EA64] p-1 shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full p-0.5" fill="none">
          <path d="M7 5v14h3.2v-5.2h3.6V19H17V5h-3.2v5.2h-3.6V5H7z" fill="#0E1E25" />
        </svg>
      </div>
    );
  }

  if (p === "codechef") {
    return (
      <div
        className={`shrink-0 flex items-center justify-center rounded-xl bg-[#FDF8F6] border border-[#F5E6E0] p-1 shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src="https://www.google.com/s2/favicons?domain=codechef.com&sz=128"
          alt="CodeChef logo"
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
    );
  }

  if (p === "github") {
    return (
      <div
        className={`shrink-0 flex items-center justify-center rounded-xl bg-gray-900 text-white p-1.5 shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      </div>
    );
  }

  if (p === "linkedin") {
    return (
      <div
        className={`shrink-0 flex items-center justify-center rounded-xl bg-[#0A66C2] text-white p-1.5 shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 flex items-center justify-center rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs ${className}`}
      style={{ width: size, height: size }}
    >
      {(platform || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

/** The single page-header pattern. Every page starts with this. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/** Section label — small caps eyebrow used above card groups. */
export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-gray-400">{children}</h2>
      {action}
    </div>
  );
}

/** The single card language. */
export function Card({
  children,
  className = "",
  padded = true,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl ${
        hover ? "transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg" : ""
      } ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  href,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  disabled?: boolean;
}) {
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  href,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50:bg-slate-800/60 ${className}`;
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** One empty-state pattern — icon chip, message, single CTA. */
export function EmptyState({
  icon: Icon,
  title,
  message,
  ctaLabel,
  ctaHref,
  onCta,
}: {
  icon: React.ElementType;
  title: string;
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-gray-100">
        <Icon className="h-5 w-5 text-gray-300" />
      </div>
      <h3 className="text-sm font-bold text-gray-700">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-400">{message}</p>}
      {(ctaLabel && ctaHref) || (ctaLabel && onCta) ? (
        ctaHref ? (
          <Link
            href={ctaHref}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            onClick={onCta}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
          >
            {ctaLabel}
          </button>
        )
      ) : null}
    </div>
  );
}

/** Status badge — semantic, tiny, uppercase. */
export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "blue" | "amber" | "red" | "violet";
}) {
  const tones = {
    gray: "bg-gray-50 text-gray-600 ring-gray-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-600 ring-red-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
