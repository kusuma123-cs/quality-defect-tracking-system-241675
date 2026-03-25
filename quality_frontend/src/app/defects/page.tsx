import React, { Suspense } from "react";
import { Card, CardBody, InlineSpinner } from "@/components/ui";
import DefectsClientPage from "./DefectsClientPage";

export default function DefectsPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardBody>
            <InlineSpinner label="Loading defects…" />
          </CardBody>
        </Card>
      }
    >
      <DefectsClientPage />
    </Suspense>
  );
}
