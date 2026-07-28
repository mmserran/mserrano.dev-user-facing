export interface ContactFields {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function buildContactMailto(contactEmail: string, fields: ContactFields): string {
  const name = fields.name.trim();
  const email = fields.email.trim();
  const subject = fields.subject.trim() || `Message from ${name}`;
  const message = fields.message.trim();
  const body = `${message}\r\n\r\n—\r\nFrom: ${name} <${email}>`;
  const params = new URLSearchParams({ subject, body });

  return `mailto:${contactEmail}?${params.toString()}`;
}
