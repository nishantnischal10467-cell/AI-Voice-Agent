import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

describe("ui components", () => {
  it("renders composed card and button controls", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Voice controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Start</Button>
        </CardContent>
      </Card>,
    );

    expect(screen.getByText("Voice controls")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
  });
});
