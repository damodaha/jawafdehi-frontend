import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

// Moderation triage for incoming submissions. There is no public-submission
// intake endpoint in the monolith yet (the old ModerationDashboard ran on mock
// data), so this page is an honest placeholder rather than fake rows. The wired
// pieces of casework — AI reviews, rules, the job queue — live under
// /admin/reviews and /admin/rules, which DO hit real APIs.
export default function Moderation() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Triage and approve incoming submissions.
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            Not wired up yet
          </CardTitle>
          <CardDescription className="text-amber-800">
            There is no submission-intake API in the monolith yet, so this view
            has no data to show. The previous moderation dashboard ran on mock
            data and was intentionally not carried over. Once an intake endpoint
            exists, this page lists pending submissions with approve / reject
            actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-amber-900">
          In the meantime, the live casework tooling is here:
          <ul className="ml-5 mt-2 list-disc space-y-1">
            <li>
              <Link to="/admin/reviews" className="underline underline-offset-2">
                Reviews
              </Link>{" "}
              — AI-assisted casework reviews and the job queue.
            </li>
            <li>
              <Link to="/admin/rules" className="underline underline-offset-2">
                Rules
              </Link>{" "}
              — the grading rules applied to reviews.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
