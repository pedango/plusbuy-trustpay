"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { readProductImage } from "@/components/shop/readProductImage";
import { formatGhs } from "@/lib/money";

type Line = {
  id: string;
  name: string;
  unitPriceMinor: number;
  quantity: number;
  orderedQuantity: number;
  buyerComment: string | null;
  buyerImageUrl: string | null;
};

type Draft = {
  comment: string;
  imageUrl: string | null;
};

export function OrderItemReview({
  orderId,
  items,
  editable,
}: {
  orderId: string;
  items: Line[];
  editable: boolean;
}) {
  const router = useRouter();
  const [lines, setLines] = useState(items);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(items.map(toDraft)));
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setLines(items);
    setDrafts(Object.fromEntries(items.map(toDraft)));
  }, [items]);

  async function send(itemId: string, body: Record<string, unknown>) {
    setBusyId(itemId);
    try {
      const res = await fetch(`/api/shop/orders/${orderId}/items/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Could not update this item");
        return;
      }
      toast.success("Saved");
      router.refresh();
    } catch {
      toast.error("Could not update this item");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6">
      {editable ? (
        <p className="mb-2 text-sm text-[var(--muted)]">
          Write a note under any item, and attach a photo if you need to. You can remove units, but not add
          them. Removing a unit lowers the order total and returns that amount from escrow before you click
          Item received.
        </p>
      ) : null}
      <ul className="divide-y divide-[var(--border)] text-sm">
        {lines.map((item) => {
          const draft = drafts[item.id] ?? { comment: "", imageUrl: null };
          const dirty =
            draft.comment !== (item.buyerComment ?? "") || draft.imageUrl !== item.buyerImageUrl;
          return (
            <li key={item.id} className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-[var(--muted)]">{formatGhs(item.unitPriceMinor)} each</p>
                  {item.quantity < item.orderedQuantity ? (
                    <p className="text-xs text-[var(--muted)]">
                      Ordered {item.orderedQuantity}, keeping {item.quantity}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--muted)]">
                      {item.quantity} unit{item.quantity === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium tabular-nums">{formatGhs(item.unitPriceMinor * item.quantity)}</p>
                  {editable ? (
                    <button
                      className="btn btn-secondary btn-sm mt-2"
                      type="button"
                      disabled={busyId === item.id || item.quantity <= 0}
                      onClick={() => send(item.id, { quantity: item.quantity - 1 })}
                    >
                      Remove one
                    </button>
                  ) : null}
                </div>
              </div>
              <label className="mt-3 block">
                <span className="label">Comment</span>
                <textarea
                  className="input mt-1 h-20 py-2"
                  maxLength={500}
                  value={draft.comment}
                  disabled={!editable || busyId === item.id}
                  placeholder="For example: 1 isn’t the size I asked for"
                  onChange={(event) =>
                    setDrafts((current) => ({
                      ...current,
                      [item.id]: { ...draft, comment: event.target.value },
                    }))
                  }
                />
              </label>
              {draft.imageUrl ? (
                <img src={draft.imageUrl} alt="" className="mt-3 h-24 w-24 rounded-lg object-cover" />
              ) : null}
              {editable ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="btn btn-secondary btn-sm">
                    {draft.imageUrl ? "Change photo" : "Attach photo"}
                    <input
                      className="hidden"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={busyId === item.id}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        try {
                          const imageUrl = await readProductImage(file);
                          setDrafts((current) => ({
                            ...current,
                            [item.id]: { ...(current[item.id] ?? draft), imageUrl },
                          }));
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Could not read image");
                        }
                      }}
                    />
                  </label>
                  {draft.imageUrl ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: { ...draft, imageUrl: null },
                        }))
                      }
                    >
                      Remove photo
                    </button>
                  ) : null}
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    disabled={!dirty || busyId === item.id}
                    onClick={() => send(item.id, { comment: draft.comment, imageUrl: draft.imageUrl })}
                  >
                    {busyId === item.id ? "Saving…" : "Save note"}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function toDraft(item: Line): [string, Draft] {
  return [item.id, { comment: item.buyerComment ?? "", imageUrl: item.buyerImageUrl }];
}
