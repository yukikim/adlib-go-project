import { Badge } from "@/components/ui/badge";
import type { RatingSummaryView } from "./types";

type RatingSummaryListProps = {
  summaries: RatingSummaryView[];
  emptyMessage?: string;
};

export function RatingSummaryList({
  summaries,
  emptyMessage = "レイティング結果はまだありません。",
}: RatingSummaryListProps) {
  if (summaries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const ratingEventIds = [
    ...new Set(summaries.map((summary) => summary.sessionEventId).filter((id) => id !== undefined)),
  ];
  function getSummariesForEvent(eventId: string) {
      const summariesForEvent = summaries.filter((summary) => summary.sessionEventId === eventId);
    return (
      <>
        <h3 className="text-lg font-medium mb-2 bg-amber-600 text-white p-2 rounded">{summariesForEvent[0]?.sessionEventTitle}</h3>
          <ul className="space-y-3">
        {summariesForEvent.map((summary) => (
              <li
                key={summary.sessionSetId}
                className="rounded-lg border bg-background/70 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">
                        {summary.songTitle}
                      </p>
                      {/* {summary.sessionEventTitle ? (
                        <Badge variant="secondary">
                          {summary.sessionEventTitle}
                        </Badge>
                      ) : null} */}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {summary.ratingCount} 件 / 合計 {summary.totalRating} / 平均{" "}
                      {summary.averageRating
                        ? summary.averageRating.toFixed(1)
                        : "-"}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {summary.averageRating
                      ? `${summary.averageRating.toFixed(1)} / 5`
                      : "未評価"}
                  </Badge>
                </div>
                {summary.comments?.length ? (
                  <div className="mt-3 rounded-md border bg-background/60 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      コメント
                    </p>
                    <ul className="mt-2 space-y-2">
                      {summary.comments.map((comment) => (
                        <li
                          key={comment.id}
                          className="rounded-md bg-muted/40 px-3 py-2 text-sm leading-6"
                        >
                          <span className="mr-2 text-xs text-muted-foreground">
                            {comment.rating} 星
                          </span>
                          {comment.comment}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    コメントはまだありません。
                  </p>
                )}
              </li>

        ))}
          </ul>
      </>

    )
  }

  return (
    <>
      {ratingEventIds.map((eventId) => (
        <div key={eventId} className="py-4 border-y-2 mb-8">
          {getSummariesForEvent(eventId)}
        </div>
      ))}
    </>
  );
}
