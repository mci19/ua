import { DescriptionList, type DescriptionItem } from "@/components/ui/description-list";
import { Heading } from "@/components/ui/heading";
import { Stack } from "@/components/ui/stack";
import { Text } from "@/components/ui/text";
import { formatDate } from "@/lib/utils/date";
import type { Contact } from "@/lib/dataverse/types";

export function StudentDetails({ student }: { student: Contact }) {
  const fullName =
    `${student.firstname ?? ""} ${student.lastname ?? ""}`.trim() ||
    student.fullname ||
    undefined;
  const homeAddress =
    student.address1_composite ||
    [student.address1_line1, student.address1_postalcode, student.address1_city]
      .filter(Boolean)
      .join(", ") ||
    undefined;
  const dormAddress =
    student.address2_composite ||
    [student.address2_line1, student.address2_postalcode, student.address2_city]
      .filter(Boolean)
      .join(", ") ||
    undefined;

  const items: DescriptionItem[] = [
    { term: "Naam", description: fullName },
    { term: "Studentnummer", description: student.ua_studentnumber },
    { term: "E-mail", description: student.emailaddress1 ?? student.ua_useremail },
    { term: "Geboortedatum", description: formatDate(student.birthdate) || undefined },
    { term: "Rijksregisternummer", description: student.ua_nationalregisternumber },
    { term: "Telefoon", description: student.mobilephone ?? student.telephone1 },
    { term: "Domicilieadres", description: homeAddress, fullWidth: true },
    { term: "Studentenverblijf", description: dormAddress, fullWidth: true },
  ];

  return (
    <Stack
      as="section"
      gap="sm"
      aria-label="Mijn gegevens"
      className="rounded border border-ua-gray-light bg-ua-gray-ultralight/60 p-4"
    >
      <Heading level="subheader" as="h3">
        Mijn gegevens
      </Heading>
      <DescriptionList items={items} />
      <Text size="small" tone="muted">
        Kloppen je gegevens niet? Pas ze aan via{" "}
        <a
          href="https://www.uantwerpen.be/sisa"
          target="_blank"
          rel="noopener noreferrer"
          className="ua-link"
        >
          SISA
        </a>
        .
      </Text>
    </Stack>
  );
}
