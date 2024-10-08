import { useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { useMaci } from "~/contexts/Maci";
import { useAppState } from "~/utils/state";
import { EAppState } from "~/utils/types";

import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";

export const JoinButton = (): JSX.Element => {
  const { isLoading, isRegistered, isEligibleToVote, onSignup } = useMaci();
  const appState = useAppState();

  const onError = useCallback(() => toast.error("Signup error"), []);
  const onSuccess = useCallback(() => toast.success("You've successfully signed up to vote!"), []);
  const handleSignup = useCallback(() => onSignup(onError, onSuccess), [onSignup, onError, onSuccess]);

  return (
    <div>
      {appState === EAppState.VOTING && !isEligibleToVote && isRegistered && (
        <Button variant="disabled">You are not allowed to vote</Button>
      )}

      {(appState === EAppState.APPLICATION || appState === EAppState.VOTING) && !isEligibleToVote && !isRegistered &&  (
        <Button variant={isRegistered === undefined || isLoading ? "disabled" : "secondary"}>
          <Link href="/signup/register">Register</Link>
        </Button>
      )}

      {appState === EAppState.VOTING && isEligibleToVote && !isRegistered && (
        <Button variant={isRegistered === undefined ? "disabled" : "secondary"} onClick={handleSignup}>
          {isLoading? <Spinner className="h-6 w-6" /> : "Voter sign up"}
        </Button>
      )}

      {appState === EAppState.TALLYING && (
        <Button variant="disabled">Voting round is over, the result is tallying.</Button>
      )}

      {appState === EAppState.RESULTS && <Button variant="secondary">View results</Button>}
    </div>
  );
};
