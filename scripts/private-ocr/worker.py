"""Private, manual-only Tesseract worker. No outbound requests or retained files."""
import hmac
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

MAX_FILE = 4 * 1024 * 1024
MAX_TEXT = 300000


def extract(body, mime):
    deadline = time.monotonic() + 40
    extension = {"application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg"}.get(mime)
    if not extension or not body or len(body) > MAX_FILE:
        raise ValueError("Invalid file")
    good = body.startswith(b"%PDF-") if extension == ".pdf" else body.startswith(b"\x89PNG\r\n\x1a\n") if extension == ".png" else body.startswith(b"\xff\xd8\xff")
    if not good:
        raise ValueError("File signature mismatch")
    if not shutil.which("tesseract"):
        raise RuntimeError("Install Tesseract on the private worker")
    with tempfile.TemporaryDirectory(prefix="medops-ocr-") as directory:
        source = Path(directory) / ("source" + extension)
        source.write_bytes(body)
        source.chmod(0o600)
        pages = [source]
        if extension == ".pdf":
            info = subprocess.run(["pdfinfo", str(source)], capture_output=True, text=True, timeout=5, check=True).stdout
            count = next(int(line.split(":")[1].strip()) for line in info.splitlines() if line.startswith("Pages:"))
            if count > 20:
                raise ValueError("Split PDFs into at most 20 pages")
            subprocess.run(["pdftoppm", "-r", "150", "-scale-to", "2400", "-png", str(source), str(Path(directory) / "page")], capture_output=True, timeout=15, check=True)
            pages = sorted(Path(directory).glob("page-*.png"))
        text = ""
        for page in pages:
            result = subprocess.run(["tesseract", str(page), "stdout", "-l", "eng+hin", "quiet"], capture_output=True, text=True, timeout=max(1, deadline - time.monotonic()), check=True)
            text += result.stdout + "\n"
            if len(text) > MAX_TEXT:
                raise ValueError("Extracted text exceeds limit")
        return text


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # Never log file contents, names, tokens or extracted text.

    def do_POST(self):
        token = os.environ.get("OCR_WORKER_TOKEN", "")
        if not token or not hmac.compare_digest(self.headers.get("Authorization", ""), "Bearer " + token):
            self.send_error(401)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= MAX_FILE:
                raise ValueError("Invalid size")
            text = extract(self.rfile.read(length), self.headers.get("Content-Type", ""))
            data = json.dumps({"text": text}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except (ValueError, RuntimeError, OSError, subprocess.SubprocessError, StopIteration):
            self.send_error(422, "OCR unavailable or file invalid; use manual entry")


if __name__ == "__main__":
    if not os.environ.get("OCR_WORKER_TOKEN"):
        raise SystemExit("OCR_WORKER_TOKEN is required")
    HTTPServer((os.environ.get("OCR_BIND", "127.0.0.1"), int(os.environ.get("OCR_PORT", "8787"))), Handler).serve_forever()
