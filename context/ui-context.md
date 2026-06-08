# UI Context

## Theme

Dark only. No light mode. The design language is a dark technical workspace — near-black backgrounds (`#070b13`, `#0a1120`), layered surfaces with subtle borders (`border-slate-800`), and emerald/teal accent colors for interactive elements. The aesthetic is clinical, modern, and professional, befitting a medical administration dashboard.

## Colors

All components use Tailwind CSS utility classes directly — no CSS custom properties. The color palette is fixed and consistent across all pages.

| Role              | Tailwind Class           | Hex       |
| ----------------- | ------------------------ | --------- |
| Page background   | `bg-[#070b13]`           | `#070b13` |
| Surface           | `bg-[#0a1120]`           | `#0a1120` |
| Card inner        | `bg-[#080d1a]`           | `#080d1a` |
| Card input        | `bg-[#070b13]`           | `#070b13` |
| Primary text      | `text-white`             | `#ffffff` |
| Secondary text    | `text-slate-200`         | `#e2e8f0` |
| Muted text        | `text-slate-400`         | `#94a3b8` |
| Dim text          | `text-slate-500`         | `#64748b` |
| Primary accent    | `text-emerald-400`       | `#34d399` |
| Primary button    | `bg-emerald-500`         | `#10b981` |
| Button hover      | `bg-emerald-400`         | `#34d399` |
| Default border    | `border-slate-800`       | `#1e293b` |
| Subtle border     | `border-slate-800/60`    | `#1e293b` |
| Error             | `text-red-400` / `bg-red-500/10` | `#f87171` |
| Success           | `text-emerald-400` / `bg-emerald-500/10` | `#34d399` |
| Warning           | `text-amber-400` / `bg-amber-500/10` | `#fbbf24` |

## Typography

| Role      | Font              | Variable      |
| --------- | ----------------- | ------------- |
| UI text   | Geist Sans        | `--font-sans` |
| Code/mono | Geist Mono        | `--font-mono` |

Font sizes: `text-[10px]` (labels/badges), `text-xs` (metadata), `text-sm` (body), `text-base` (section titles), `text-lg`/`text-xl`/`text-2xl` (page headings). Font weights: `font-medium` (default), `font-semibold` (emphasis), `font-bold` (titles), `font-black` (hero headings), `font-mono` (code/dates/IDs).

## Border Radius

| Context           | Class               |
| ----------------- | ------------------- |
| Inline / small UI | `rounded-lg`        |
| Cards / panels    | `rounded-2xl`       |
| Modals / overlays | `rounded-2xl`       |
| Buttons           | `rounded-xl`        |
| Inputs            | `rounded-xl`        |
| Badges            | `rounded-full`      |
| Icons in cards    | `rounded-xl`        |
| Feature icons     | `rounded-2xl`       |

## Component Library

No external component library. All UI is built with raw Tailwind CSS classes in each page file. Common patterns:
- **Cards**: `bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 shadow-sm`
- **Buttons**: `bg-emerald-500 hover:bg-emerald-400 text-[#070b13] rounded-xl font-semibold transition-all`
- **Inputs**: `bg-[#070b13] border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50`
- **Select dropdowns**: Same as inputs, with `cursor-pointer`
- **Badges**: `bg-{color}-500/10 text-{color}-400 border border-{color}-500/25 px-2 py-0.5 rounded-full font-medium text-[10px]`
- **Stat cards**: `bg-[#0a1120] border border-slate-800/70 p-5 rounded-2xl flex items-center justify-between`
- **Tables**: `w-full text-left border-collapse`, header `bg-[#0d172b]/50`, rows `divide-y divide-slate-800/60`

## Layout Patterns

- **Dashboard layout**: Full-viewport flex with left sidebar (w-64) + main content area. Sidebar: brand header, nav links, user info, logout at bottom.
- **Page layout**: `max-w-7xl mx-auto` centered container, `flex flex-col gap-6` for vertical stacking.
- **Split views**: `flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden` — e.g., Call Logs page.
- **Grid layouts**: `grid grid-cols-1 lg:grid-cols-{n} gap-6` for stat cards, feature grids.
- **Modals**: `fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm` with centered card.
- **Empty states**: Centered flex column with icon + title + description.
- **Loading states**: Animated pulse dots (`animate-pulse` on small rounded spans).

## Icons

Lucide React. Stroke-based icons only. Sizes: `w-4 h-4` for inline, `w-5 h-5` for buttons/stat cards, `w-3.5 h-3.5` for small indicators. Import individual icons by name (tree-shakeable). Common icons: `Calendar`, `Phone`, `User`, `Search`, `Filter`, `Plus`, `X`, `Check`, `Clock`, `TrendingUp`, `BarChart3`, `Settings`, `Sparkles`, `AlertCircle`.

## Motion / Animation

- **Framer Motion** for all animations: `motion.div`, `motion.button`, `AnimatePresence`
- **Page entrance**: `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}`
- **Stagger children**: `containerVariants` with `staggerChildren: 0.1`, `itemVariants` with `y: 20 → y: 0`
- **Stat cards**: `initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}` with staggered delay
- **Hover effects**: `whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}`
- **Pulsing indicators**: `animate-pulse` CSS for live status dots
- **Loading dots**: Three `<span>` elements with staggered `animate-pulse`
- **List entries**: `initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}` with delay based on index
