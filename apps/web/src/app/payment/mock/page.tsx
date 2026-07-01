import { Suspense } from "react";
import MockPaymentClient from "./MockPaymentClient";

export const dynamic = "force-dynamic";

export default function MockPaymentPage() {
  return (
    <Suspense>
      <MockPaymentClient />
    </Suspense>
  );
}
