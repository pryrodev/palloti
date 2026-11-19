"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FileText, Images, Newspaper, RefreshCw, Video } from "lucide-react";
import { useTable, type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert";
import { DataGrid, DataGridContainer, dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getArticleSegment } from "@/lib/seoPaths";
import { useCmsCollection } from "@/lib/useCmsCollection";

type Article = { id: number; slug?: string; title: string; date: string; tags: string; summary: string };
type Publication = { id: number; title: string };
type GalleryItem = { src: string; title: string };
type VideoItem = { src: string; title: string };
type ArticleRow = { id: string; date: string; sortDate: number; title: string; tags: string; href: string };
type DashboardProps = { onNavigate: (section: string) => void };

function dateValue(value: string) {
  const match = value.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value: string) {
  const timestamp = dateValue(value);
  return timestamp ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(timestamp) : value || "—";
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const newsQuery = useCmsCollection<{ en: Article[]; fr: Article[] }>("news");
  const publicationsQuery = useCmsCollection<Publication[]>("publications");
  const galleryQuery = useCmsCollection<GalleryItem[]>("gallery");
  const videosQuery = useCmsCollection<VideoItem[]>("videos");
  const [sorting, setSorting] = useState<SortingState>([{ id: "sortDate", desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });

  const articles = newsQuery.data?.en;
  const rows = useMemo<ArticleRow[]>(() => (articles ?? [])
    .map((article) => ({
      id: String(article.id),
      date: formatDate(article.date),
      sortDate: dateValue(article.date),
      title: article.title,
      tags: article.tags?.split("|")[0]?.trim() || "News",
      href: `/en/news/${getArticleSegment(article)}`,
    }))
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, 12), [articles]);

  const columns = useMemo<ColumnDef<DataGridFeatures, ArticleRow>[]>(() => [
    {
      id: "sortDate",
      accessorKey: "sortDate",
      header: ({ column }) => <DataGridColumnHeader title="Date" column={column} />,
      cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.date}</span>,
      meta: { skeleton: <Skeleton className="h-4 w-20 rounded-none" /> },
    },
    {
      accessorKey: "title",
      header: ({ column }) => <DataGridColumnHeader title="Article" column={column} />,
      cell: ({ row }) => <Link href={row.original.href} className="line-clamp-2 font-medium text-foreground decoration-[#C9952A] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9952A]">{row.original.title}</Link>,
      meta: { skeleton: <Skeleton className="h-4 w-48 rounded-none" /> },
    },
    {
      accessorKey: "tags",
      header: ({ column }) => <DataGridColumnHeader title="Category" column={column} />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.tags}</span>,
      meta: { skeleton: <Skeleton className="h-4 w-24 rounded-none" /> },
    },
  ], []);

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    getRowId: (row) => row.id,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  });

  const stats = [
    { label: "News articles", value: newsQuery.data?.en.length, loading: newsQuery.isLoading, detail: newsQuery.data ? `${newsQuery.data.fr.length} in French` : "English content", icon: Newspaper, section: "news" },
    { label: "Publications", value: publicationsQuery.data?.length, loading: publicationsQuery.isLoading, detail: "Documents and resources", icon: FileText, section: "publications" },
    { label: "Gallery images", value: galleryQuery.data?.length, loading: galleryQuery.isLoading, detail: "Items in the media gallery", icon: Images, section: "gallery" },
    { label: "Videos", value: videosQuery.data?.length, loading: videosQuery.isLoading, detail: "Published video items", icon: Video, section: "videos" },
  ];
  const queries = [newsQuery, publicationsQuery, galleryQuery, videosQuery];
  const failed = queries.filter((query) => query.isError);
  const isRetrying = queries.some((query) => query.isFetching);

  async function retryFailedQueries() {
    await Promise.all(failed.map((query) => query.refetch()));
  }

  const quickLinks = [
    { key: "news", label: "Manage news", description: "Create, edit, and publish articles", icon: Newspaper },
    { key: "publications", label: "Manage publications", description: "Update documents and resources", icon: FileText },
    { key: "media", label: "Media library", description: "Browse reusable image and video assets", icon: Images },
  ];

  return <div className="space-y-6">
    {failed.length > 0 && <Alert variant="destructive" className="rounded-none border-red-200 bg-red-50 text-red-950">
      <AlertTitle>Some dashboard data could not be loaded</AlertTitle>
      <AlertDescription className="text-red-800">
        Check the database connection, then retry. Content editors remain available from the sidebar.
        <Button type="button" variant="outline" size="sm" className="mt-2 rounded-none border-red-300 bg-white text-red-900 hover:bg-red-100" onClick={retryFailedQueries} disabled={isRetrying}>
          <RefreshCw aria-hidden="true" /> {isRetrying ? "Retrying…" : "Retry loading"}
        </Button>
      </AlertDescription>
    </Alert>}

    <section aria-label="Content overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return <Frame key={stat.label} spacing="xs" className="[--frame-radius:0px] [--frame-panel-radius:0px] border-[#e8d8c5] bg-white">
          <FramePanel className="flex min-h-24 flex-col justify-between border-[#eadfd2] bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <div className="mt-1.5 text-2xl font-semibold tabular-nums text-[#3e2009]">
                  {stat.value === undefined ? stat.loading ? <Skeleton className="mt-1 h-7 w-14 rounded-none" /> : "—" : stat.value}
                </div>
              </div>
              <span className="grid size-8 place-items-center border border-[#eadfd2] bg-[#fbf7f1] text-[#9e711a]"><Icon aria-hidden="true" className="size-4" /></span>
            </div>
            <div className="mt-3 flex items-end justify-between gap-2">
              <p className="min-w-0 whitespace-nowrap text-[5px] leading-[7px] text-muted-foreground">{stat.detail}</p>
              <button
                type="button"
                aria-label={`Manage ${stat.label}`}
                title={`Manage ${stat.label}`}
                onClick={() => onNavigate(stat.section)}
                className="grid size-6 shrink-0 place-items-center text-[#70411e] hover:bg-[#fbf7f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9952A]"
              >
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          </FramePanel>
        </Frame>;
      })}
    </section>

    <section aria-labelledby="quick-actions-title">
      <div className="mb-3">
        <h2 id="quick-actions-title" className="text-base font-semibold text-[#3e2009]">Quick actions</h2>
        <p className="mt-1 text-sm text-muted-foreground">Jump directly to a content workspace.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return <Frame key={item.key} spacing="xs" className="[--frame-radius:0px] [--frame-panel-radius:0px] border-[#e8d8c5] bg-white">
            <FramePanel className="flex min-h-28 items-center justify-between gap-4 border-[#eadfd2] bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center border border-[#eadfd2] bg-[#fbf7f1] text-[#9e711a]"><Icon aria-hidden="true" className="size-4" /></span>
                <div><FrameTitle className="text-sm text-[#3e2009]">{item.label}</FrameTitle><FrameDescription className="mt-1 text-xs leading-5">{item.description}</FrameDescription></div>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={item.label} className="rounded-none text-[#70411e]" onClick={() => onNavigate(item.key)}><ArrowUpRight aria-hidden="true" /></Button>
            </FramePanel>
          </Frame>;
        })}
      </div>
    </section>

    <section aria-labelledby="recent-news-title">
      <Frame spacing="xs" className="[--frame-radius:0px] [--frame-panel-radius:0px] border-[#e8d8c5] bg-white">
        <FrameHeader className="flex-row items-center justify-between gap-4 border-b border-[#eadfd2] px-4 py-3">
          <div><FrameTitle id="recent-news-title" className="text-base text-[#3e2009]">Recent news</FrameTitle><FrameDescription className="mt-1 text-xs">Latest articles available in the CMS.</FrameDescription></div>
          <Button type="button" variant="outline" size="sm" className="rounded-none border-[#dfcdb6] text-[#70411e]" onClick={() => onNavigate("news")}>All news <ArrowUpRight aria-hidden="true" /></Button>
        </FrameHeader>
        <FramePanel className="p-0">
          <DataGrid table={table} recordCount={rows.length} isLoading={newsQuery.isLoading}
            emptyMessage={<div className="space-y-2 py-4 text-center"><p>No news articles are available yet.</p><Button type="button" variant="outline" size="sm" className="rounded-none" onClick={() => onNavigate("news")}>Create an article</Button></div>}
            tableLayout={{ dense: true, rowBorder: true, headerBorder: true }}
            tableClassNames={{ base: "min-w-[680px]", headerRow: "bg-[#fbf7f1]" }}>
            <DataGridContainer className="rounded-none border-0 shadow-none">
              <DataGridScrollArea orientation="horizontal"><DataGridTable /></DataGridScrollArea>
              <DataGridPagination sizes={[5, 10]} sizesLabel="Rows per page" info="{from}–{to} of {count} articles" className="border-t border-[#eadfd2] px-3 py-2" />
            </DataGridContainer>
          </DataGrid>
        </FramePanel>
      </Frame>
    </section>
  </div>;
}
