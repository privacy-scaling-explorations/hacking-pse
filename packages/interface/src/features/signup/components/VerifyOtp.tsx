import { useState } from "react"
import { useRouter } from "next/router"
import { toast } from "sonner"
import { Address, encodeAbiParameters, parseAbiParameters } from "viem"
import { publicClient } from "~/utils/permissionless"
import { Identity } from "@semaphore-protocol/core"
import SemaphoreAbi from "~/utils/Semaphore.json"

import { config, semaphore } from "~/config"
import { Form, FormControl, FormSection } from "~/components/ui/Form"
import { Input } from "~/components/ui/Input"
import { OtpFieldSchema, OtpField } from "../types"
import { Button } from "~/components/ui/Button"
import useSmartAccount from "~/hooks/useSmartAccount"
import { getSemaphoreProof } from "~/utils/semaphore"
import { useMaci } from "~/contexts/Maci"
import { useEthersSigner } from "~/hooks/useEthersSigner"
import { Spinner } from "~/components/ui/Spinner"

interface IVerifyOtpProps {
  emailField: {
    email: string
  }
}

const VerifyOtp = ({ emailField }: IVerifyOtpProps): JSX.Element => {
  const { address, smartAccount, smartAccountClient } = useSmartAccount()
  const signer = useEthersSigner({ client: smartAccountClient })
  const { updateEligibility } = useMaci()
  const router = useRouter()

  const [verifying, setVerifying] = useState(false)

  const verifyOtp = async (otpField: OtpField) => {
    try {
      setVerifying(true)
      if (!address) {
        throw new Error("Smart account does not exist")
      }

      const { email: email } = emailField // the component that can call this function only renders when the email exists
      const { otp: otp } = otpField

      const response = await fetch(`${config.backendUrl}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          address,
        }),
      })
      const json = await response.json()

      if (!response.ok) {
        console.log(response.status)
        console.error(json)
        toast.error((json.errors && json.errors[0]) ?? json.message)
      } else {
        toast.success("OTP verified - now joining Semaphore group")
        await joinSemaphoreGroup()
        router.push("/signup")
      }
    } catch (error: any) {
      console.error(error)
      toast.error("An unexpected error occured verifying the OTP")
    } finally {
      setVerifying(false)
    }
  }

  const joinSemaphoreGroup = async () => {
    if (!smartAccount || !smartAccountClient) {
      throw new Error("Smart account does not exist")
    }

    const semaphoreIdentity = localStorage.getItem("semaphoreIdentity")
    if (!semaphoreIdentity || !signer) {
      throw new Error("No Semaphore Identity or signer")
    }

    const identityCommitment = new Identity(semaphoreIdentity).commitment
    const data = encodeAbiParameters(parseAbiParameters("uint"), [
      semaphore.hatId,
    ])

    const { request } = await publicClient.simulateContract({
      account: smartAccount,
      address: semaphore.contracts.semaphore as Address,
      abi: SemaphoreAbi.abi,
      functionName: "gateAndAddMember",
      args: [identityCommitment, data],
    })
    const txHash = await smartAccountClient.writeContract(request)
    console.log("txHash", txHash)

    // TODO: (merge-ok) come up with a better fix
    await new Promise((resolve) => setTimeout(resolve, 20000))

    const proof = await getSemaphoreProof(
      signer,
      new Identity(semaphoreIdentity)
    )
    await updateEligibility(proof, address)

    toast.success("Joined Semaphore group")
  }

  return (
    <div className="w-72 sm:w-96">
      <Form schema={OtpFieldSchema} onSubmit={(otp) => verifyOtp(otp)}>
        <FormSection
          description="Please enter the one-time-password (OTP) you recieved in your email"
          title="Enter OTP"
        >
          <FormControl
            required
            valueAsNumber
            hint="Check your 'pse.dev' or 'ethereum.org' inbox for the OTP"
            label="OTP"
            name="otp"
          >
            <Input placeholder="1234" type="number" />
          </FormControl>
          <Button
            suppressHydrationWarning
            size="auto"
            type="submit"
            variant="secondary"
          >
            {verifying ? <Spinner className="h-6 w-6" /> : "Verify OTP"}
          </Button>
        </FormSection>
      </Form>
    </div>
  )
}

export default VerifyOtp
