import os
from werkzeug.utils import secure_filename

UPLOAD_DIR = "backend/uploads"

def save_file(ticket_id, category, file):
    """
    Save the uploaded file to the ticket's folder.
    """
    # Determine folder paths
    if category == "mobile":
        category_folder = "mobile_tickets"
    elif category == "vm":
        category_folder = "vm_tickets"
    elif category == "environment":
        category_folder = "environment_tickets"
    else:
        category_folder = "other_tickets"

    ticket_folder = os.path.join(UPLOAD_DIR, category_folder, ticket_id)
    os.makedirs(ticket_folder, exist_ok=True)

    filename = secure_filename(file.filename or "upload.bin")
    file_path = os.path.join(ticket_folder, filename)

    # Stream write (safer than reading everything at once)
    with open(file_path, "wb") as f:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)

    try:
        file.file.close()
    except Exception:
        pass

    return file_path