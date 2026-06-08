---
name: frontend-page
description: Creates new Next.js 16 frontend pages for the Shasthya Seba AI dashboard. Use when building a new page under frontend/app/(dashboard)/. Follows dark theme, framer-motion, and Tailwind v4 conventions.
---

# Frontend Page Development — Shasthya Seba AI

## Page Template

```tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Filter, X, ... } from "lucide-react";

export default function FeaturePage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 max-w-7xl mx-auto"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Page Title</h2>
          <p className="text-sm text-slate-400">Page description goes here.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] transition-all">
          <Plus className="w-4 h-4" />
          Primary Action
        </button>
      </div>

      {/* Content */}
      ...
    </motion.div>
  );
}
```

## Styling Cheatsheet

| Element        | Classes                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| Page wrapper   | `flex flex-col gap-6 max-w-7xl mx-auto`                                 |
| Card           | `bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 shadow-sm`     |
| Card inner     | `bg-[#080d1a] border border-slate-800/60 rounded-xl p-3.5`              |
| Stat card      | `bg-[#0a1120] border border-slate-800/70 p-5 rounded-2xl`              |
| Button primary | `bg-emerald-500 hover:bg-emerald-400 text-[#070b13] rounded-xl font-semibold` |
| Button outline | `text-slate-400 hover:text-white bg-[#070b13] border border-slate-800`  |
| Input          | `bg-[#070b13] border border-slate-800 rounded-xl text-sm text-slate-200` |
| Select         | Same as input + `cursor-pointer`, options have `className="bg-[#0a1120]"` |
| Badge success  | `bg-emerald-500/10 text-emerald-400 border border-emerald-500/25`       |
| Badge warning  | `bg-amber-500/10 text-amber-400 border border-amber-500/25`             |
| Badge error    | `bg-red-500/10 text-red-400 border border-red-500/25`                   |
| Badge muted    | `bg-slate-800 text-slate-400 border border-slate-700/50`                |
| Table cell     | `py-4 px-6 text-xs text-slate-300`                                      |
| Table header   | `py-4 px-6 text-[11px] text-slate-400 uppercase tracking-wider`         |
| Modal overlay  | `fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm` |
| Modal card     | `bg-[#0a1120] border border-slate-800 rounded-2xl w-full max-w-md p-6`  |
| Empty state    | `py-20 text-center flex flex-col items-center justify-center gap-3`     |

## Animated List Pattern

```tsx
import { motion, AnimatePresence } from "framer-motion";

{items.map((item, idx) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.05 }}
  >
    {item.name}
  </motion.div>
))}
```

## Form with Zod Validation

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Invalid BD phone"),
});

type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});

// In JSX:
<input {...register("name")} className="..." />
{errors.name && <span className="text-[10px] text-red-400">{errors.name.message}</span>}
```

## Search / Filter Bar Pattern

```tsx
<div className="bg-[#0a1120] border border-slate-800/60 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
  <div className="relative w-full md:w-80">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
    <input type="text" placeholder="Search..." value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
  </div>
  <select value={filter} onChange={...} className="bg-[#070b13] border border-slate-800 rounded-xl px-3 py-1.5 text-xs ...">
    <option className="bg-[#0a1120]">All</option>
  </select>
</div>
```

## Adding Sidebar Link

In `frontend/app/(dashboard)/layout.tsx`, add to the `navigation` array:

```typescript
const navigation = [
  { name: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Call Logs",    href: "/calls",        icon: PhoneCall },
  { name: "Analytics",    href: "/analytics",    icon: BarChart3 },
  { name: "Settings",     href: "/settings",     icon: SettingsIcon },
  // Add new:
  { name: "Patients",     href: "/patients",     icon: User },
];
```

Choose icons from `lucide-react`. Common ones: `User, Calendar, Phone, BarChart3, Settings, Package, FlaskConical, Pill, Ambulance, Video, CreditCard, Bell, Stethoscope, Activity`.
