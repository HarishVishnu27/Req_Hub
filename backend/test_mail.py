import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# SMTP configuration
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "25"))
MAIL_FROM = os.getenv("MAIL_FROM")
MAIL_TO = "Yogalakshmi.Thanikasalam@cognizant.com"

DEBUG = os.getenv("SMTP_DEBUG", "false").lower() == "true"
REQUIRE_TLS = os.getenv("SMTP_REQUIRE_TLS", "false").lower() == "true"

# Create the email message
subject = "Test Email"
body = """
Hello,

This is a test email to verify SMTP configuration.

Best regards,
HPC | Request HUB
"""

msg = EmailMessage()
msg["Subject"] = subject
msg["From"] = MAIL_FROM
msg["To"] = MAIL_TO
msg.set_content(body)

try:
    print("Connecting to SMTP server...")
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
        if DEBUG:
            smtp.set_debuglevel(1)
        smtp.ehlo()

        # Start TLS if required
        if REQUIRE_TLS or smtp.has_extn("starttls"):
            print("Attempting STARTTLS...")
            smtp.starttls()
            smtp.ehlo()
            print("STARTTLS succeeded.")

        # Authentication skipped since it's not supported
        print(f"Sending email to {MAIL_TO}...")
        smtp.send_message(msg)
        print("Email sent successfully without authentication!")

except Exception as e:
    print(f"Failed to send email: {e}")