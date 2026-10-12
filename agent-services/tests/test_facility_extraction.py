"""Regression checks for Gemini's omitted/null booking details."""
import importlib.util
import sys
from pathlib import Path
from unittest.mock import patch

import pytest
from pydantic import ValidationError

agent_dir = Path(__file__).resolve().parents[1] / "venv" / "Agents" / "FacilityAgent"
sys.path.insert(0, str(agent_dir))
spec = importlib.util.spec_from_file_location("facility_agents_under_test", agent_dir / "agents.py")
module = importlib.util.module_from_spec(spec)
with patch("langchain_google_genai.ChatGoogleGenerativeAI"):
    spec.loader.exec_module(module)


def test_booking_with_null_counts_keeps_requested_date_and_time():
    result = module.ExtractionOutput.model_validate({
        "facility": "Swimming Pool", "date": "2026-10-13",
        "start_time": "18:00:00", "end_time": "20:00:00",
        "guests": None, "visitor_vehicles": None,
    })
    assert (result.guests, result.visitor_vehicles) == (1, 0)
    assert (result.date, result.start_time, result.end_time) == (
        "2026-10-13", "18:00:00", "20:00:00")


def test_explicit_counts_are_preserved():
    result = module.ExtractionOutput(guests=8, visitor_vehicles=2)
    assert (result.guests, result.visitor_vehicles) == (8, 2)


def test_greeting_zero_guests_does_not_crash():
    result = module.ExtractionOutput(is_general_query=True, guests=0)
    assert result.is_general_query
    assert result.guests == 1


@pytest.mark.parametrize("field", ["guests", "visitor_vehicles"])
def test_negative_counts_are_rejected(field):
    with pytest.raises(ValidationError):
        module.ExtractionOutput.model_validate({field: -1})
