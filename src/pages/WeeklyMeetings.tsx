import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Calendar, Lock, Video, Youtube } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JAWAFDEHI_WEEKLY_SERIES } from "@/config/constants";

// Nepal has no daylight saving and sits at a fixed UTC+5:45.
const NEPAL_OFFSET_MINUTES = 5 * 60 + 45;

const MEETING_ZONES = [
  { key: "nepal", timeZone: "Asia/Kathmandu", abbrev: "NPT" },
  { key: "pacific", timeZone: "America/Los_Angeles" },
  { key: "eastern", timeZone: "America/New_York" },
] as const;

// The next occurrence of the recurring meeting, as a precise UTC instant.
// Nepal time → UTC is a fixed offset; US zones are derived natively below so
// daylight saving is handled by the runtime, not by us.
function nextMeetingInstant(now: Date, weekday: number, hour: number, minute: number): Date {
  const utcMinutes = hour * 60 + minute - NEPAL_OFFSET_MINUTES;
  const target = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  target.setUTCMinutes(utcMinutes);
  let diff = (weekday - target.getUTCDay() + 7) % 7;
  if (diff === 0 && now.getTime() > target.getTime()) {
    diff = 7;
  }
  target.setUTCDate(target.getUTCDate() + diff);
  return target;
}

function zoneAbbrev(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
    hour: "numeric",
  }).formatToParts(instant);
  return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
}

const WeeklyMeetings = () => {
  const { t, i18n } = useTranslation();
  const {
    zoomUrl,
    zoomMeetingId,
    zoomPasscode,
    youtubeChannel,
    youtubePlaylistId,
    meetingWeekday,
    meetingHour,
    meetingMinute,
  } = JAWAFDEHI_WEEKLY_SERIES;

  // Recompute after mount so the displayed times reflect the viewer's "now"
  // (and current DST), rather than the build-time pre-render.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setNow(new Date());
  }, []);

  const meetingTimes = useMemo(() => {
    const instant = nextMeetingInstant(now, meetingWeekday, meetingHour, meetingMinute);
    const locale = `${i18n.language || "en"}-u-nu-latn`;
    return MEETING_ZONES.map((zone) => {
      const weekdayTime = new Intl.DateTimeFormat(locale, {
        timeZone: zone.timeZone,
        weekday: "long",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(instant);
      const abbrev = "abbrev" in zone ? zone.abbrev : zoneAbbrev(instant, zone.timeZone);
      return { key: zone.key, label: `${weekdayTime} ${abbrev}` };
    });
  }, [now, i18n.language, meetingWeekday, meetingHour, meetingMinute]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Weekly Corruption Series — Jawafdehi</title>
        <meta
          name="description"
          content="Join Jawafdehi's weekly corruption series: a live public meeting on Zoom analyzing Nepal's corruption cases, also streamed on YouTube."
        />
        <link rel="canonical" href="https://jawafdehi.org/weekly-series" />
        <meta property="og:site_name" content="Jawafdehi Nepal" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://jawafdehi.org/weekly-series" />
        <meta property="og:title" content="Weekly Corruption Series — Jawafdehi" />
        <meta
          property="og:description"
          content="Join Jawafdehi's weekly corruption series: a live public meeting on Zoom analyzing Nepal's corruption cases, also streamed on YouTube."
        />
        <meta property="og:image" content="https://jawafdehi.org/og-favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Weekly Corruption Series — Jawafdehi" />
        <meta
          name="twitter:description"
          content="Join Jawafdehi's weekly corruption series: a live public meeting on Zoom analyzing Nepal's corruption cases, also streamed on YouTube."
        />
        <meta name="twitter:image" content="https://jawafdehi.org/og-favicon.png" />
      </Helmet>

      <main id="main-content" className="flex-1">
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t("weeklyMeetings.eyebrow")}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("weeklyMeetings.title")}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {t("weeklyMeetings.intro")}
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-md rounded-2xl border bg-secondary/30 px-5 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                {t("weeklyMeetings.schedule.heading")}
              </p>
            </div>
            <dl className="mt-3 space-y-1.5" suppressHydrationWarning>
              {meetingTimes.map((row) => (
                <div
                  key={row.key}
                  className="flex items-baseline justify-between gap-4 text-sm"
                >
                  <dt className="text-muted-foreground">
                    {t(`weeklyMeetings.schedule.${row.key}`)}
                  </dt>
                  <dd className="font-medium text-foreground">{row.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Video className="h-5 w-5 text-primary" />
                  {t("weeklyMeetings.zoom.heading")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("weeklyMeetings.zoom.description")}
                </p>
                <dl className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <dt className="font-medium text-foreground">
                      {t("weeklyMeetings.zoom.meetingId")}:
                    </dt>
                    <dd className="tabular-nums text-muted-foreground">{zoomMeetingId}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <dt className="font-medium text-foreground">
                      {t("weeklyMeetings.zoom.passcode")}:
                    </dt>
                    <dd className="tabular-nums text-muted-foreground">{zoomPasscode}</dd>
                  </div>
                </dl>
                <Button asChild variant="primary" className="w-full">
                  <a href={zoomUrl} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4" />
                    {t("weeklyMeetings.zoom.cta")}
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Youtube className="h-5 w-5 text-primary" />
                  {t("weeklyMeetings.youtube.heading")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("weeklyMeetings.youtube.description")}
                </p>
                <Button asChild variant="outline" className="w-full">
                  <a href={youtubeChannel} target="_blank" rel="noopener noreferrer">
                    <Youtube className="h-4 w-4" />
                    {t("weeklyMeetings.youtube.cta")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {youtubePlaylistId && (
            <div className="mx-auto mt-12 max-w-4xl">
              <div className="aspect-video overflow-hidden rounded-2xl border bg-secondary/30">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/videoseries?list=${youtubePlaylistId}`}
                  title={t("weeklyMeetings.youtube.playlistTitle")}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default WeeklyMeetings;
