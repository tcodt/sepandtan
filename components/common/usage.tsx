import React from "react";
import Steps from "./steps";

export default function Usage() {
  return (
    <section className="mb-12 p-4 md:p-8 bg-muted">
      <h3 className="text-foreground md:text-2xl text-xl text-center font-semibold block mt-12 mb-20">
        چطور سپندتن کار می‌کند؟
      </h3>
      <Steps />
    </section>
  );
}
