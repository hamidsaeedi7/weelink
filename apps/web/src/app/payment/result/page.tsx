import { Suspense } from "react";
import PaymentResultClient from "./PaymentResultClient";

export const dynamic = "force-dynamic";

export default function PaymentResultPage() {
  return (
    <Suspense>
      <PaymentResultClient />
    </Suspense>
  );
}
