"""ReceiptScanService — calls OpenAI to extract structured data from receipt text.

Text branch is implemented here.  An image branch can be added later by
adding a `scan_image(image_bytes, ...)` method that builds a vision message and
reuses `_validate_and_build_response`.

Raises `ReceiptScanError` only on OpenAI transport/timeout failures so the
router can release the reserved quota unit.  Bad or partial model output is
handled with safe defaults — never raises on model weirdness.
"""
import json
import re
import logging
from typing import Optional

from openai import AsyncOpenAI, APIError, APIConnectionError, APITimeoutError

from src.transaction.schemas import ReceiptScanResponse

logger = logging.getLogger(__name__)

# Internal Pydantic model for raw model output -------------------------

from pydantic import BaseModel as _BaseModel


class _RawScan(_BaseModel):
    amount: Optional[float] = None
    date: Optional[str] = None
    merchant: Optional[str] = None
    type: Optional[str] = None
    category_id: Optional[str] = None
    currency: Optional[str] = None


class ReceiptScanError(Exception):
    """Raised on OpenAI transport failures (network, timeout, auth).

    The router catches this, decrements the reserved quota, and returns 5xx.
    """


class ReceiptScanService:
    """Thin wrapper around AsyncOpenAI for structured receipt extraction."""

    def __init__(self, client: AsyncOpenAI, settings) -> None:
        self._client = client
        self._settings = settings

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def scan_text(
        self,
        text: str,
        categories: list,
        currency: Optional[str] = None,
    ) -> ReceiptScanResponse:
        """Extract structured fields from OCR text using the text model.

        Args:
            text: Raw OCR text (lines joined by newline or already a string).
            categories: List of CategoryModel objects with .id, .name, .type.
            currency: User's default currency (ISO-4217) as a hint; may be None.

        Returns:
            ReceiptScanResponse with safe defaults for any unrecognised field.

        Raises:
            ReceiptScanError: on OpenAI transport/timeout failures ONLY.
        """
        messages = self._build_prompt(text, categories, currency)
        response_format = self._build_strict_schema()

        try:
            response = await self._client.chat.completions.create(
                model=self._settings.OPENAI_SCAN_TEXT_MODEL,
                messages=messages,
                response_format=response_format,
            )
        except (APITimeoutError,) as exc:
            raise ReceiptScanError(f"OpenAI timeout: {exc}") from exc
        except (APIConnectionError, APIError) as exc:
            raise ReceiptScanError(f"OpenAI error: {exc}") from exc
        except Exception as exc:
            raise ReceiptScanError(f"Unexpected OpenAI client error: {exc}") from exc

        raw_content = response.choices[0].message.content or "{}"
        return self._parse_and_validate(raw_content, categories, currency)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_strict_schema(self) -> dict:
        """Return the response_format dict for strict JSON schema output."""
        return {
            "type": "json_schema",
            "json_schema": {
                "name": "receipt_extraction",
                "strict": True,
                "schema": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "amount":      {"type": ["number", "null"]},
                        "date":        {"type": ["string", "null"]},
                        "merchant":    {"type": ["string", "null"]},
                        "type":        {"type": "string", "enum": ["income", "expense"]},
                        "category_id": {"type": ["string", "null"]},
                        "currency":    {"type": ["string", "null"]},
                    },
                    "required": ["amount", "date", "merchant", "type", "category_id", "currency"],
                },
            },
        }

    def _build_prompt(
        self,
        text: str,
        categories: list,
        currency: Optional[str],
    ) -> list:
        """Build OpenAI messages for receipt extraction."""
        category_lines = "\n".join(
            f"  - id={c.id}, name={c.name}, type={c.type}"
            for c in categories
        ) or "  (no categories available)"

        currency_hint = f"Default currency hint: {currency}." if currency else ""

        system_content = (
            "You are a receipt data extraction assistant. "
            "Extract structured fields from the provided OCR receipt text.\n\n"
            "Rules:\n"
            "1. amount: Extract the GRAND TOTAL (not subtotal or individual item prices). "
            "Must be a positive number or null if not found.\n"
            "2. date: Extract the transaction date as YYYY-MM-DD. "
            "Return null if absent or ambiguous.\n"
            "3. merchant: Extract the store or business name. "
            "Return null if not identifiable.\n"
            "4. type: Use 'expense' for purchases/payments, 'income' for refunds/payments received. "
            "Default to 'expense'.\n"
            "5. category_id: Choose ONLY from the user's categories listed below by their exact id, "
            "or null if none matches.\n"
            "6. currency: ISO-4217 code (e.g. USD, EUR, COP). "
            f"Return null if not present in the text. {currency_hint}\n\n"
            "User's categories:\n"
            f"{category_lines}"
        )

        user_content = f"Receipt text:\n\n{text}"

        return [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ]

    def _parse_and_validate(
        self,
        raw_content: str,
        categories: list,
        currency: Optional[str],
    ) -> ReceiptScanResponse:
        """Parse JSON string from model, validate fields with safe defaults."""
        try:
            data = json.loads(raw_content)
            raw = _RawScan.model_validate(data)
        except Exception as exc:
            logger.warning("Failed to parse OpenAI receipt response: %s | raw=%r", exc, raw_content)
            raw = _RawScan()

        # --- amount: must be positive float ---
        amount: Optional[float] = None
        if raw.amount is not None:
            try:
                a = float(raw.amount)
                amount = a if a > 0 else None
            except (TypeError, ValueError):
                pass

        # --- date: must match YYYY-MM-DD ---
        date: Optional[str] = None
        if raw.date:
            if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw.date.strip()):
                date = raw.date.strip()

        # --- merchant ---
        merchant: Optional[str] = raw.merchant if isinstance(raw.merchant, str) and raw.merchant.strip() else None

        # --- type: coerce to income|expense, default expense ---
        t = raw.type or "expense"
        scan_type = t if t in ("income", "expense") else "expense"

        # --- category_id: membership guard (anti-hallucination) ---
        valid_ids = {c.id for c in categories}
        category_id: Optional[str] = raw.category_id if raw.category_id in valid_ids else None

        # --- currency ---
        scan_currency: Optional[str] = (
            raw.currency.strip()
            if isinstance(raw.currency, str) and raw.currency.strip()
            else None
        )

        return ReceiptScanResponse(
            amount=amount,
            date=date,
            merchant=merchant,
            type=scan_type,
            category_id=category_id,
            currency=scan_currency,
        )
