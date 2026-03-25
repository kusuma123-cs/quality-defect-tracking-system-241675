import Link from "next/link";
import React from "react";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid place-items-center py-14">
      <Card className="w-full max-w-lg">
        <CardHeader
          title="404 – Page Not Found"
          subtitle="The page you’re looking for doesn’t exist."
        />
        <CardBody>
          <Link href="/">
            <Button>Go to dashboard</Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
