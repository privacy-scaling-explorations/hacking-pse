import { Heading } from "~/components/ui/Heading";

import { FAQItem } from "./FaqItem";

export const FAQList = (): JSX.Element => (
  <div className="mt-28 flex flex-col items-center justify-center dark:text-white">
    <Heading size="6xl">FAQ</Heading>

    <FAQItem
      description="Vote on your favourite Hacking PSE Projects"
      title="what is the focus of this round?"
    />

    <FAQItem
      description="Owning a @pse.dev or @ethereum.org email"
      title="Who are the requirements for participation?"
    />

    <FAQItem
      description={
        <div className="flex flex-col gap-4">
          <p>Minimal Anti-Collusion Infrastructure (MACI) is a private, on-chain, voting system.</p>

          <p>
            MACI is an open-source cryptographic protocol designed to facilitate secure, anonymous voting systems while
            minimizing the potential for collusion, manipulation and bribery using zero-knowledge proofs.
          </p>
        </div>
      }
      title="What is MACI?"
    />

    <FAQItem
      description="Join our Discord channel #hacking-pse to learn more!"
      title="Do you have any other questions?"
    />
  </div>
);
