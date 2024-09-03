import { useMemo, useCallback, useState } from "react"
import { useFormContext } from "react-hook-form"

import { Button, IconButton } from "~/components/ui/Button"
import { Dialog } from "~/components/ui/Dialog"
import { Spinner } from "~/components/ui/Spinner"
import { useIsCorrectNetwork } from "~/hooks/useIsCorrectNetwork"

import type { Application } from "../types"
import type { ImpactMetrix, ContributionLink, FundingSource } from "~/features/projects/types"
import useSmartAccount from "~/hooks/useSmartAccount"

export enum EApplicationStep {
  PROFILE,
  ADVANCED,
  REVIEW,
}

interface IApplicationButtonsProps {
  step: EApplicationStep
  isUploading: boolean
  isPending: boolean
  onNextStep: () => void
  onBackStep: () => void
}

export const ApplicationButtons = ({
  step,
  isUploading,
  isPending,
  onNextStep,
  onBackStep,
}: IApplicationButtonsProps): JSX.Element => {
  const { isCorrectNetwork } = useIsCorrectNetwork()

  const { address } = useSmartAccount()

  const [showDialog, setShowDialog] = useState<boolean>(false)

  const form = useFormContext<Application>()

  const [
    name,
    bio,
    websiteUrl,
    profileImageUrl,
    bannerImageUrl,
    contributionDescription,
    impactDescription,
    contributionLinks
  ] = useMemo(
    () =>
      form.watch([
        "name",
        "bio",
        "websiteUrl",
        "profileImageUrl",
        "bannerImageUrl",
        "contributionDescription",
        "impactDescription",
        "contributionLinks"
      ]),
    [form],
  )

  const checkLinks = (
    links: Pick<ContributionLink | ImpactMetrix | FundingSource, "description">[] | undefined,
  ): boolean =>
    links === undefined || links.every((link) => link.description !== undefined && link.description.length > 0)

  const checkStepComplete = (): boolean => {
    if (step === EApplicationStep.PROFILE) {
      return (
        bio.length > 0 &&
        name.length > 0 &&
        websiteUrl.length > 0
      )
    }

    if (step === EApplicationStep.ADVANCED) {
      return (
        contributionDescription.length > 0 &&
        impactDescription.length > 0 &&
        checkLinks(contributionLinks)
      )
    }

    return true
  }

  const handleOnClickNextStep = useCallback(
    (event: UIEvent) => {
      event.preventDefault()

      if (checkStepComplete()) {
        onNextStep()
      } else {
        setShowDialog(true)
      }
    },
    [onNextStep, setShowDialog, checkStepComplete],
  )

  const handleOnClickBackStep = useCallback(
    (event: UIEvent) => {
      event.preventDefault()
      onBackStep()
    },
    [onBackStep],
  )

  const handleOnOpenChange = useCallback(() => {
    setShowDialog(false)
  }, [setShowDialog])

  return (
    <div className="flex justify-end gap-2">
      <Dialog
        description="There are still some inputs not fulfilled, please complete all the required information."
        isOpen={showDialog}
        size="sm"
        title="Please complete all the required information"
        onOpenChange={handleOnOpenChange}
      />

      {step !== EApplicationStep.PROFILE && (
        <Button className="text-gray-300 underline" size="auto" variant="ghost" onClick={handleOnClickBackStep}>
          Back
        </Button>
      )}

      {step !== EApplicationStep.REVIEW && (
        <Button size="auto" variant="secondary" onClick={handleOnClickNextStep}>
          Next
        </Button>
      )}

      {step === EApplicationStep.REVIEW && (
        <IconButton
          disabled={isPending || !address || !isCorrectNetwork}
          icon={isPending ? Spinner : null}
          isLoading={isPending}
          size="auto"
          type="submit"
          variant="secondary"
        >
          {isUploading ? "Uploading metadata" : "Submit"}
        </IconButton>
      )}
    </div>
  )
}
