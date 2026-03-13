import type { IngestEndpoint } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface MessagesFiltersCardProps {
  endpoints: IngestEndpoint[];
  q: string;
  setQ: (value: string) => void;
  filterEndpointId: string;
  setFilterEndpointId: (value: string) => void;
  group: string;
  setGroup: (value: string) => void;
  priorityMin: string;
  setPriorityMin: (value: string) => void;
  priorityMax: string;
  setPriorityMax: (value: string) => void;
  tag: string;
  setTag: (value: string) => void;
  fromDate: string;
  setFromDate: (value: string) => void;
  toDate: string;
  setToDate: (value: string) => void;
  onSubmit: () => void;
}

export function MessagesFiltersCard({
  endpoints,
  q,
  setQ,
  filterEndpointId,
  setFilterEndpointId,
  group,
  setGroup,
  priorityMin,
  setPriorityMin,
  priorityMax,
  setPriorityMax,
  tag,
  setTag,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onSubmit,
}: MessagesFiltersCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-sm font-semibold">Filters</div>
      <form
        className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="msg-q">Search</Label>
          <Input id="msg-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="body text" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="msg-ep">Endpoint</Label>
          <select
            id="msg-ep"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={filterEndpointId}
            onChange={(e) => setFilterEndpointId(e.target.value)}
          >
            <option value="">All</option>
            {endpoints.map((ep) => (
              <option key={ep.id} value={ep.id}>{ep.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="msg-group">Group</Label>
          <Input id="msg-group" value={group} onChange={(e) => setGroup(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="msg-pmin">Priority min</Label>
          <Input id="msg-pmin" type="number" value={priorityMin} onChange={(e) => setPriorityMin(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="msg-pmax">Priority max</Label>
          <Input id="msg-pmax" type="number" value={priorityMax} onChange={(e) => setPriorityMax(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="msg-tag">Tag</Label>
          <Input id="msg-tag" value={tag} onChange={(e) => setTag(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="msg-from">From</Label>
          <Input id="msg-from" type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="msg-to">To</Label>
          <Input id="msg-to" type="datetime-local" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Search</Button>
        </div>
      </form>
    </div>
  );
}
