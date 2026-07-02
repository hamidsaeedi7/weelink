import { Suspense } from "react";
import PlanCallbackClient from "./PlanCallbackClient";

export const dynamic = "force-dynamic";

export default function PlanCallbackPage() {
  return (
    <Suspense>
      <PlanCallbackClient />
    </Suspense>
  );
}
