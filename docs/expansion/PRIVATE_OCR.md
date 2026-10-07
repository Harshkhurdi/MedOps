# Private OCR setup

Scanned OCR is optional and disabled by default. Manual entry and selectable-PDF extraction work without it. The reference worker calls only local [Tesseract](https://tesseract-ocr.github.io/tessdoc/Command-Line-Usage.html) and Poppler commands; it performs no outbound requests and deletes temporary files after each operation.

Use a trusted worker host with Tesseract English/Hindi language files, `pdfinfo` and `pdftoppm`. Start `scripts/private-ocr/worker.py` with `OCR_WORKER_TOKEN` set privately. It binds to loopback port 8787 by default. The supplied Dockerfile can build the worker on operator infrastructure. Run it as its non-root user with a read-only root, a size-limited private `/tmp`, CPU/memory/process limits, no outbound internet and restricted network ingress. Keep these packages patched. Never place tokens or company files in the image/repository.

For Vercel, put an authenticated, operator-controlled HTTPS endpoint in front of this private worker. Configure `OCR_WORKER_URL`, `OCR_WORKER_TOKEN`, `OCR_WORKER_APPROVED=true` using secure environment management. The app does not accept user-supplied destinations, follows no redirects, applies a timeout and bounds the response. Do not point it at external OCR SaaS or LLM services.

Only an authenticated user with OCR write and document-module write permissions can explicitly confirm processing a selected private PDF/image. No automatic extraction or field updates occur. PDFs are limited to 20 pages per worker request; uploads are limited to 4 MB. Extracted text is unverified and must be checked manually. If packages/worker are missing or unavailable, the UI reports unavailability and manual entry remains usable.

Protocol, permission, disabled configuration, output labels and failure behavior are tested. The production environment currently has no OCR worker configured; real scanned OCR cannot be asserted until the operator provisions and verifies that worker. The container is supplied but is not claimed built on a machine without Docker.
