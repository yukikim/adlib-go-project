import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatEventDate } from "@/lib/utils";
import type { ArchiveView } from "./types";

type ArchiveListProps = {
  archives: ArchiveView[];
  className?: string;
  emptyMessage?: string;
  id?: string;
  renderActions?: (archive: ArchiveView) => ReactNode;
};

// 管理画面とマイページで同じアーカイブ内容を表示するための共通リスト。
// 管理者固有の削除操作だけは renderActions から差し込み、閲覧内容の差異を防ぐ。
export function ArchiveList({
  archives,
  className,
  emptyMessage = "アーカイブはありません。",
  id,
  renderActions,
}: ArchiveListProps) {
  if (archives.length === 0) {
    return (
      <p id={id} className={cn("text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul id={id} className={cn("grid gap-3", className)}>
      {archives.map((archive) => (
        <li key={archive.id}>
          <details className="group rounded-xl border bg-background/60 p-4">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{archive.title}</p>
                    <Badge variant="outline">v{archive.version}</Badge>
                    {archive.deletedAt ? (
                      <Badge variant="destructive">削除済み</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatEventDate(archive.eventDate)} / 参加者{" "}
                    {archive.participantCount} 名 / sessionSet {archive.setCount} 件
                    / レイティング {archive.ratingCount} 件
                  </p>
                </div>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </div>
            </summary>

            <div className="mt-4 space-y-5 border-t pt-4 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="font-medium">アーカイブ名称</dt>
                  <dd className="mt-1 text-muted-foreground">{archive.title}</dd>
                </div>
                <div>
                  <dt className="font-medium">イベント開催日</dt>
                  <dd className="mt-1 text-muted-foreground">
                    {formatEventDate(archive.eventDate)}
                  </dd>
                </div>
              </dl>

              <div>
                <h4 className="font-medium">
                  参加者（{archive.participants.length} 名）
                </h4>
                {archive.participants.length === 0 ? (
                  <p className="mt-2 text-muted-foreground">
                    参加者情報はありません。
                  </p>
                ) : (
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {archive.participants.map((participant) => (
                      <li
                        key={participant.id}
                        className="rounded-md border px-3 py-2"
                      >
                        {participant.displayName}
                        {participant.mainInstrument ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {participant.mainInstrument}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h4 className="font-medium">
                  sessionSet / レイティング結果
                </h4>
                {archive.sets.length === 0 ? (
                  <p className="mt-2 text-muted-foreground">
                    sessionSet はありません。
                  </p>
                ) : (
                  <ol className="mt-2 space-y-3">
                    {archive.sets.map((sessionSet, index) => {
                      const rating = sessionSet.ratingSummary;
                      const memberRows = [
                        [
                          "Dr",
                          sessionSet.drumName ? [sessionSet.drumName] : [],
                        ],
                        [
                          "Ba",
                          sessionSet.bassName ? [sessionSet.bassName] : [],
                        ],
                        [
                          "Pf",
                          sessionSet.pianoName ? [sessionSet.pianoName] : [],
                        ],
                        ["Front", sessionSet.frontSnapshot],
                        ["Vo", sessionSet.vocalSnapshot],
                      ] as const;

                      return (
                        <li
                          key={sessionSet.id}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium">
                              {sessionSet.setOrder ?? index + 1}.{" "}
                              {sessionSet.songTitle}
                              {sessionSet.keyName
                                ? `（Key: ${sessionSet.keyName}）`
                                : ""}
                            </p>
                            <Badge variant="secondary">
                              {rating?.ratingCount ?? 0} 件 / 平均{" "}
                              {rating?.averageRating != null
                                ? rating.averageRating.toFixed(1)
                                : "-"}
                            </Badge>
                          </div>
                          <dl className="mt-2 grid gap-x-4 gap-y-1 text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                            {memberRows.map(([label, names]) => (
                              <div key={label} className="flex gap-2">
                                <dt className="font-medium text-foreground">
                                  {label}
                                </dt>
                                <dd>
                                  {names.length > 0 ? names.join("、") : "-"}
                                </dd>
                              </div>
                            ))}
                          </dl>
                          {rating ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              最小 {rating.minRating ?? "-"} / 最大{" "}
                              {rating.maxRating ?? "-"} / 分布{" "}
                              {[5, 4, 3, 2, 1]
                                .map(
                                  (score) =>
                                    `★${score}: ${
                                      rating.distribution[String(score)] ?? 0
                                    }件`,
                                )
                                .join("、")}
                            </p>
                          ) : (
                            <p className="mt-2 text-xs text-muted-foreground">
                              レイティング結果はありません。
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              {renderActions?.(archive)}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
