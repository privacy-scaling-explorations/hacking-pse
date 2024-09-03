import { useRouter } from "next/router"
import { useState, useCallback } from "react"
import { useLocalStorage } from "react-use"
import { toast } from "sonner"
import { Hex } from "viem"

import { ImageUpload } from "~/components/ImageUpload"
import { FieldArray, Form, FormControl, FormSection, Select, Textarea } from "~/components/ui/Form"
import { Input } from "~/components/ui/Input"
import { useIsCorrectNetwork } from "~/hooks/useIsCorrectNetwork"

import { useCreateApplication } from "../hooks/useCreateApplication"
import { ApplicationSchema, contributionTypes } from "../types"

import { ApplicationButtons, EApplicationStep } from "./ApplicationButtons"
import { ApplicationSteps } from "./ApplicationSteps"
import { ReviewApplicationDetails } from "./ReviewApplicationDetails"
import useSmartAccount from "~/hooks/useSmartAccount"

export const ApplicationForm = (): JSX.Element => {
  const clearDraft = useLocalStorage("application-draft")[2]

  const { isCorrectNetwork, correctNetwork } = useIsCorrectNetwork()

  const { address } = useSmartAccount()

  const router = useRouter()

  /**
   * There are 3 steps for creating an application.
   * The first step is to set the project introduction (profile);
   * the second step is to set the contributions, impacts, and funding sources (advanced);
   * the last step is to review the input values, allow editing by going back to previous steps (review).
   */
  const [step, setStep] = useState<EApplicationStep>(EApplicationStep.PROFILE)

  const handleNextStep = useCallback(() => {
    if (step === EApplicationStep.PROFILE) {
      setStep(EApplicationStep.ADVANCED)
    } else if (step === EApplicationStep.ADVANCED) {
      setStep(EApplicationStep.REVIEW)
    }
  }, [step, setStep])

  const handleBackStep = useCallback(() => {
    if (step === EApplicationStep.REVIEW) {
      setStep(EApplicationStep.ADVANCED)
    } else if (step === EApplicationStep.ADVANCED) {
      setStep(EApplicationStep.PROFILE)
    }
  }, [step, setStep])

  const create = useCreateApplication({
    onSuccess: (hash: Hex) => {
      clearDraft()
      router.push(`/applications/confirmation?txHash=${hash}`)
    },
    onError: (err: { reason?: string; data?: { message: string } }) => {
      toast.error("Application create error", {
        description: err.reason ?? err.data?.message,
      })
      console.log(err)
    },
  })

  const { error: createError } = create

  return (
    <div className="dark:border-lighterBlack rounded-lg border border-gray-200 p-4">
      <ApplicationSteps step={step} />

      <Form
        schema={ApplicationSchema}
        onSubmit={(application) => {
          create.mutate(application)
        }}
      >
        <FormSection
          className={step === EApplicationStep.PROFILE ? "block" : "hidden"}
          description="Please provide information about your project."
          title="Project Profile"
        >
          <FormControl required hint="What is the name of your project?" label="Project name" name="name">
            <Input placeholder="Type your project name" />
          </FormControl>

          <FormControl required label="Description" name="bio">
            <Textarea placeholder="Describe your project" rows={4} />
          </FormControl>

          <div className="gap-4 md:flex">
            <FormControl required className="flex-1" label="Link to Project" name="websiteUrl">
              <Input placeholder="https://" />
            </FormControl>
          </div>

          <div className="mb-4 gap-4 md:flex">
            <FormControl
              required
              hint="The size should be smaller than 1MB."
              label="Project avatar"
              name="profileImageUrl"
            >
              <ImageUpload className="h-48 w-48 " />
            </FormControl>

            <FormControl
              required
              className="flex-1"
              hint="The size should be smaller than 1MB."
              label="Project background image"
              name="bannerImageUrl"
            >
              <ImageUpload className="h-48 " />
            </FormControl>
          </div>
        </FormSection>

        <FormSection
          className={step === EApplicationStep.ADVANCED ? "block" : "hidden"}
          description="Describe the contribution and impact of your project."
          title="Contribution & Impact"
        >
          <FormControl required label="Contributors" name="contributionDescription">
            <Textarea placeholder="Who contributed to this project?" rows={5} />
          </FormControl>

          <FormControl required label="Impact description" name="impactDescription">
            <Textarea placeholder="How do you see this project being impactful?" rows={4} />
          </FormControl>

          <FieldArray
            description="Where can we find more information about your project?"
            name="contributionLinks"
            renderField={(field, i) => (
              <div className="mb-4 flex flex-wrap gap-2">
                <FormControl required className="min-w-96" name={`contributionLinks.${i}.description`}>
                  <Input placeholder="Description (project plan, demo video, etc)" />
                </FormControl>

                <FormControl required className="min-w-72" name={`contributionLinks.${i}.url`}>
                  <Input placeholder="https://" />
                </FormControl>

                <FormControl required name={`contributionLinks.${i}.type`}>
                  <Select>
                    {Object.entries(contributionTypes).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </div>
            )}
            title="Additional links"
          />
        </FormSection>

        {step === EApplicationStep.REVIEW && <ReviewApplicationDetails />}

        {step === EApplicationStep.REVIEW && (
          <div className="mb-2 w-full text-right text-sm italic text-blue-400">
            {!address && <p>You must connect wallet to create an application</p>}

            {!isCorrectNetwork && <p className="gap-2">You must be connected to {correctNetwork.name}</p>}

            {createError && (
              <p>
                Make sure you&apos;re not connected to a VPN since this can cause problems with the RPC and your wallet.
              </p>
            )}
          </div>
        )}

        <ApplicationButtons
          isPending={create.isPending}
          isUploading={create.isUploading}
          step={step}
          onBackStep={handleBackStep}
          onNextStep={handleNextStep}
        />
      </Form>
    </div>
  )
}
