import requests

BASE_URL = "http://localhost:3000"
REGISTER_ENDPOINT = f"{BASE_URL}/api/coupang/register"
TIMEOUT = 30

def test_single_product_creation_without_options():
    # Prepare a product payload without any option values
    product_payload = {
        "productName": "Test Product Without Options",
        "wholesalePrice": 10000,
        "price": 15000,
        "platform": "rocket"  # platform field is optional but included for completeness
    }

    try:
        response = requests.post(
            REGISTER_ENDPOINT,
            json=product_payload,
            timeout=TIMEOUT
        )
        # Successful creation expected: 200 OK
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        # Response content could be empty or confirm success, so verify JSON or success message if applicable
        try:
            json_data = response.json()
            assert isinstance(json_data, dict), "Response JSON is not a dictionary"
            # Optionally, check keys or values if API defines them (not specified here)
        except ValueError:
            # If no JSON response, at least the status code is checked above
            pass

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_single_product_creation_without_options()