import os
import smtplib
import mimetypes
from email.message import EmailMessage


def send_email(subject, to_email, body, cc_email=None, attachments=None, is_html=True):
    """
    Send an email using the SMTP configuration.

    :param attachments: list of file paths to attach
    :param is_html: when True, body is sent as HTML (recommended for templates)
    """
    try:
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", "25"))
        mail_from = os.getenv("MAIL_FROM")

        if not smtp_host:
            raise ValueError("SMTP_HOST is not set in the environment variables.")
        if not mail_from:
            raise ValueError("MAIL_FROM is not set in the environment variables.")
        if not to_email:
            raise ValueError("Recipient email (to_email) is missing.")

        print(f"Connecting to SMTP server {smtp_host}:{smtp_port}")

        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = mail_from
        msg["To"] = to_email
        if cc_email:
            msg["Cc"] = cc_email

        # Plain text fallback (some clients)
        msg.set_content("This email requires an HTML capable email client.")

        if is_html:
            msg.add_alternative(body, subtype="html")
        else:
            msg.set_content(body)

        # Attachments
        if attachments:
            for file_path in attachments:
                try:
                    if not file_path or not os.path.exists(file_path):
                        print(f"Attachment not found, skipping: {file_path}")
                        continue

                    ctype, encoding = mimetypes.guess_type(file_path)
                    if ctype is None or encoding is not None:
                        ctype = "application/octet-stream"
                    maintype, subtype = ctype.split("/", 1)

                    filename = os.path.basename(file_path)
                    with open(file_path, "rb") as f:
                        msg.add_attachment(
                            f.read(),
                            maintype=maintype,
                            subtype=subtype,
                            filename=filename,
                        )
                except Exception as attach_err:
                    print(f"Failed to attach {file_path}: {attach_err}")

        with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as smtp:
            smtp.ehlo()

            require_tls = os.getenv("SMTP_REQUIRE_TLS", "false").lower() == "true"
            if require_tls or smtp.has_extn("starttls"):
                print("Attempting STARTTLS...")
                smtp.starttls()
                smtp.ehlo()
                print("STARTTLS succeeded.")

            print(f"Sending email to {to_email}...")
            smtp.send_message(msg)
            print("Email sent successfully!")

    except Exception as e:
        print(f"Failed to send email: {e}")