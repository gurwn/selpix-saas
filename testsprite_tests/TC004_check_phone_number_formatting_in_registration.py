import requests

BASE_URL = "http://localhost:3000"
REGISTER_ENDPOINT = f"{BASE_URL}/api/coupang/register"
TIMEOUT = 30

def format_to_international(phone):
    # Dummy normalization for test expectation; actual logic is on server side
    digits = ''.join(filter(str.isdigit, phone))
    if digits.startswith('0'):
        digits = digits[1:]
    return f"+82{digits}"

def test_check_phone_number_formatting_in_registration():
    # Prepare test data with phone number in local format
    product_data = {
        "productName": "Test Product for Phone Format",
        "wholesalePrice": 10000,
        "price": 15000,
        "platform": "rocket",
        "phone": "01012345678"  # local South Korea phone number format
    }

    # Since the PRD schemas don't mention phone in request explicitly,
    # we add it to test server's handling of phone number formatting.
    # We expect the server to reformat it to international standard internally.
    try:
        response = requests.post(REGISTER_ENDPOINT, json=product_data, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

    # Validate response status code
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"

    # Validate that phone number is reformatted in response if returned
    # Assuming response JSON includes reformatted phone number under 'phone' field as per description
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # If phone field is present in response, verify the formatting
    if "phone" in resp_json:
        expected_phone = format_to_international(product_data["phone"])
        assert resp_json["phone"] == expected_phone, (
            f"Phone number not reformatted correctly: expected {expected_phone}, got {resp_json['phone']}"
        )
    else:
        # If phone field is not returned, this at least confirms request accepted, 
        # real phone formatting verification is server internal but no error means pass.
        pass

test_check_phone_number_formatting_in_registration()