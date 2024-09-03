import { useRouter } from "next/router";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

import { useMaci } from "~/contexts/Maci";
import { useAppState } from "~/utils/state";
import { EAppState } from "~/utils/types";

import { Dialog } from "./ui/Dialog";
import useSmartAccount from "~/hooks/useSmartAccount";

export const EligibilityDialog = (): JSX.Element | null => {
  const { address } = useSmartAccount();

  const [openDialog, setOpenDialog] = useState<boolean>(!!address);
  const [pathname, setPathname] = useState("");
  const { onSignup, isEligibleToVote, isRegistered, initialVoiceCredits, votingEndsAt, isLoading } = useMaci();
  const router = useRouter();

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const appState = useAppState();

  const onError = useCallback(() => toast.error("Signup error"), []);
  const onSuccess = useCallback(() => toast.success("You've successfully signed up to vote!"), []);

  const handleSignup = useCallback(async () => {
    await onSignup(onError, onSuccess);
    setOpenDialog(false);
  }, [onSignup, onError, setOpenDialog]);

  useEffect(() => {
    setOpenDialog(!!address);
  }, [address, setOpenDialog]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, [setOpenDialog]);

  const handleGoToProjects = useCallback(() => {
    router.push("/projects");
  }, [router]);

  const handleGoToCreateApp = useCallback(() => {
    router.push("/applications/new");
  }, [router]);

  const handleGoToRegister = useCallback(() => {
    router.push("/signup/register");
  }, [router]);

  if (
    (appState === EAppState.APPLICATION || appState === EAppState.VOTING) &&
    !isEligibleToVote &&
    !isRegistered &&
    !isLoading &&
    !pathname.includes("signup/register")
  ) {
    return (
      <Dialog
        button="secondary"
        buttonAction={handleGoToRegister}
        buttonName="Register"
        description={
          <div className="flex flex-col gap-4">
            <p>Register with your email address to get started</p>
          </div>
        }
        isOpen={openDialog}
        size="sm"
        title="Register now"
        onOpenChange={handleCloseDialog}
      />
    );
  }

  if (appState === EAppState.APPLICATION && isEligibleToVote) {
    return (
      <Dialog
        button="secondary"
        buttonAction={handleGoToCreateApp}
        buttonName="Create Application"
        description={
          <div className="flex flex-col gap-4">
            <p>Start creating your own application now!</p>
          </div>
        }
        isOpen={openDialog}
        size="sm"
        title="You're all set to apply"
        onOpenChange={handleCloseDialog}
      />
    );
  }

  if (appState === EAppState.VOTING && isRegistered) {
    return (
      <Dialog
        button="secondary"
        buttonAction={handleGoToProjects}
        buttonName="See all projects"
        description={
          <div className="flex flex-col gap-4">
            <p>You have {initialVoiceCredits} voice credits to vote with.</p>

            <p>
              Get started by adding projects to your ballot, then adding the
              amount of votes you want to allocate to each one.
            </p>

            <p>Please submit your ballot by {votingEndsAt.toString()} date!</p>
          </div>
        }
        isOpen={openDialog}
        size="sm"
        title="You're all set to vote"
        onOpenChange={handleCloseDialog}
      />
    );
  }

  if (appState === EAppState.VOTING && !isRegistered && isEligibleToVote) {
    return (
      <Dialog
        button="secondary"
        buttonAction={handleSignup}
        buttonName="Join voting round"
        description={
          <div className="flex flex-col gap-6">
            <p>Next, you will need to join the voting round.</p>

            <i>
              <span>Learn more about this process </span>

              <a href="https://maci.pse.dev" rel="noreferrer" target="_blank">
                <u>here</u>
              </a>

              <span>.</span>
            </i>
          </div>
        }
        isOpen={openDialog}
        size="sm"
        title="Account verified!"
        onOpenChange={handleCloseDialog}
        isLoading={isLoading}
      />
    );
  }

  if (appState === EAppState.TALLYING) {
    return (
      <Dialog
        description="The result is under tallying, please come back to check the result later."
        isOpen={openDialog}
        size="sm"
        title="The result is under tallying"
        onOpenChange={handleCloseDialog}
      />
    );
  }

  return <div />;
};
