#!/usr/bin/env bash
# Prints a reminder every 30 minutes to trigger a code review.
# Usage: bash .devin/scripts/review-reminder.sh &
# Stop with: kill %1  (or kill the PID)

INTERVAL=1800  # 30 minutes in seconds

echo "Review reminder started — will ping every $((INTERVAL / 60)) minutes."
echo "Stop with: kill $$"
echo ""

while true; do
    sleep "$INTERVAL"
    echo ""
    echo "⏰ $(date '+%H:%M') — Time for a code review!"
    echo "   Run /review in Cascade to trigger a full review."
    echo ""
done
