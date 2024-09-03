import { FaGithub, FaEthereum } from "react-icons/fa"
import { RiGlobalLine } from "react-icons/ri"

import { Link } from "~/components/ui/Link"

import { type ImpactMetrix, type ContributionLink, type FundingSource, EContributionType } from "../types"

interface ProjectDescriptionSectionProps {
  title: string
  description?: string
  contributions?: ContributionLink[]
  impacts?: ImpactMetrix[]
  fundings?: FundingSource[]
}

export const ProjectDescriptionSection = ({
  title,
  description = "",
  contributions = [],
  impacts = [],
}: ProjectDescriptionSectionProps): JSX.Element => (
  <div className="flex flex-col gap-6">
    <p className="text-lg uppercase">{title}</p>

    {description.length > 0 && <p className="text-lg text-gray-400">{description}</p>}

    {contributions.length > 0 && (
      <div className="border-l border-gray-200 px-4">
        <p className="text-sm uppercase text-gray-800">{title} links</p>

        {contributions.map((link) => (
          <Link key={link.type} href={link.url} target="_blank">
            {link.type === (EContributionType.GITHUB_REPO as string) && <FaGithub />}

            {link.type === (EContributionType.CONTRACT_ADDRESS as string) && <FaEthereum />}

            {link.type === (EContributionType.OTHER as string) && <RiGlobalLine />}

            {link.description}
          </Link>
        ))}
      </div>
    )}

    {impacts.length > 0 && (
      <div className="border-l border-gray-200 px-4">
        <p className="text-sm uppercase text-gray-800">{title} links</p>

        {impacts.map((link) => (
          <Link key={link.description} href={link.url} target="_blank">
            {link.description}

            {link.number && ` - ${link.number}k`}
          </Link>
        ))}
      </div>
    )}

  </div>
)
