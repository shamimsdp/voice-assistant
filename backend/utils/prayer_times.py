"""
utils/prayer_times.py — Bangladesh prayer times & public holiday guard.
Prevents scheduling calls during Jumma (Friday 12–2pm) and BD public holidays.
Uses the free Aladhan API (no key needed).
"""
import httpx
import structlog
from datetime import date, time, datetime
from functools import lru_cache
from config import get_settings

settings = get_settings()
logger = structlog.get_logger()

# Bangladesh Public Holidays (fixed dates — Gregorian)
BD_FIXED_HOLIDAYS: dict[tuple[int, int], str] = {
    (2, 21):  "International Mother Language Day (Shaheed Dibash)",
    (3, 17):  "Birth of Bangabandhu Sheikh Mujibur Rahman",
    (3, 26):  "Independence Day",
    (4, 14):  "Pohela Boishakh (Bengali New Year)",
    (5, 1):   "May Day",
    (8, 15):  "National Mourning Day",
    (11, 7):  "National Revolution & Solidarity Day",
    (12, 16): "Victory Day",
    (12, 25): "Christmas Day",
}

# Jumma prayer time window (Friday)
JUMMA_START = time(12, 0)
JUMMA_END   = time(14, 0)


def is_bd_public_holiday(d: date | None = None) -> tuple[bool, str]:
    """Check if a date is a BD public holiday. Returns (is_holiday, name)."""
    d = d or date.today()
    key = (d.month, d.day)
    name = BD_FIXED_HOLIDAYS.get(key)
    return (name is not None, name or "")


def is_jumma_time(dt: datetime | None = None) -> bool:
    """Check if datetime falls during Friday Jumma prayer (12–2pm)."""
    dt = dt or datetime.now()
    if dt.weekday() != 4:   # 4 = Friday
        return False
    return JUMMA_START <= dt.time() <= JUMMA_END


async def get_prayer_times(city: str = "Dhaka", country: str = "Bangladesh") -> dict:
    """
    Fetch today's prayer times from Aladhan API.
    Returns dict with Fajr, Dhuhr, Asr, Maghrib, Isha times.
    """
    try:
        async with httpx.AsyncClient() as client:
            today = date.today()
            resp = await client.get(
                f"{settings.aladhan_api_url}/timingsByCity/{today.strftime('%d-%m-%Y')}",
                params={"city": city, "country": country, "method": 1},
                timeout=8.0,
            )
            resp.raise_for_status()
            data = resp.json()
            timings = data["data"]["timings"]
            logger.info("Prayer times fetched", city=city, timings=timings)
            return timings
    except Exception as exc:
        logger.warning("Could not fetch prayer times", error=str(exc))
        # Fallback approximate times for Dhaka
        return {
            "Fajr": "04:30", "Sunrise": "06:00",
            "Dhuhr": "12:05", "Asr": "15:30",
            "Maghrib": "18:15", "Isha": "19:30",
        }


def should_avoid_scheduling(dt: datetime) -> tuple[bool, str]:
    """
    Check if a datetime should be avoided for scheduling.

    Returns:
        (should_avoid: bool, reason: str)
    """
    is_holiday, holiday_name = is_bd_public_holiday(dt.date())
    if is_holiday:
        return True, f"Public holiday: {holiday_name}"

    if is_jumma_time(dt):
        return True, "Jumma prayer time (Friday 12–2pm)"

    # Avoid very early (before 8am) or very late (after 9pm)
    if dt.hour < 8:
        return True, "Too early (before 8:00 AM)"
    if dt.hour >= 21:
        return True, "Too late (after 9:00 PM)"

    return False, ""
