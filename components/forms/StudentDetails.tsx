import type { Contact } from "@/lib/dataverse/types";
import { formatDate } from "@/lib/utils/date";

export function StudentDetails({ student }: { student: Contact }) {
  const fullName = `${student.firstname ?? ""} ${student.lastname ?? ""}`.trim() || student.fullname;
  const homeAddress =
    student.address1_composite ??
    [student.address1_line1, student.address1_postalcode, student.address1_city]
      .filter(Boolean)
      .join(", ");
  const dormAddress =
    student.address2_composite ??
    [student.address2_line1, student.address2_postalcode, student.address2_city]
      .filter(Boolean)
      .join(", ");
  return (
    <section
      aria-label="Mijn gegevens"
      className="rounded border border-ua-gray-light bg-ua-gray-ultralight/60 p-4"
    >
      <h3 className="mb-3 text-label font-semibold text-ua-navy">Mijn gegevens</h3>
      <dl className="grid gap-3 text-small sm:grid-cols-2">
        <Row label="Naam" value={fullName} />
        <Row label="Studentnummer" value={student.ua_studentnumber} />
        <Row label="E-mail" value={student.emailaddress1 ?? student.ua_useremail} />
        <Row label="Geboortedatum" value={formatDate(student.birthdate)} />
        <Row label="Rijksregisternummer" value={student.ua_nationalregisternumber} />
        <Row label="Telefoon" value={student.mobilephone ?? student.telephone1} />
        <Row label="Domicilieadres" value={homeAddress} fullWidth />
        <Row label="Studentenverblijf" value={dormAddress} fullWidth />
      </dl>
      <p className="mt-3 text-small text-muted-foreground">
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
      </p>
    </section>
  );
}

function Row({
  label,
  value,
  fullWidth,
}: {
  label: string;
  value?: string | null;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <dt className="text-small text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value ? value : "—"}</dd>
    </div>
  );
}
