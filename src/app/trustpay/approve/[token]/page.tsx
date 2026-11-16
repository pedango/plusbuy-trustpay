"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { MomoPrompt } from "@/components/trustpay/MomoPrompt";

const NETWORK_LABELS: Record<string, string> = {
  MTN_MOMO: "MTN MoMo",
  TELECEL_CASH: "Telecel Cash",
  AIRTELTIGO_MONEY: "AirtelTigo Money",
};

export default function ApprovePage() {
  const params = useParams<{ token: string }>();
  const [payment, setPayment] = useState<{
    amountMinor: number;
    returnUrl: string;
    payerPhone?: string | null;
    network?: string | null;
  } | null>(null);

  useEffect(() => {
    void fetch(`/api/trustpay/v1/checkout/${params.token}`)
      .then((res) => res.json())
      .then((body: { data?: { payment: typeof payment }; error?: { message: string } }) => {
        if (!body.data?.payment) {
          toast.error(body.error?.message ?? "Prompt not found");
          return;
        }
        setPayment(body.data.payment);
      });
  }, [params.token]);

  if (!payment) return <p>Loading phone prompt…</p>;

  return (
    <MomoPrompt
      token={params.token}
      amountMinor={payment.amountMinor}
      phone={payment.payerPhone ?? "your mobile money number"}
      networkLabel={NETWORK_LABELS[payment.network ?? ""] ?? "Mobile money"}
      returnUrl={payment.returnUrl}
    />
  );
}
