import requests

BASE_URL = "http://localhost:3000"
REGISTER_ENDPOINT = "/api/coupang/register"
FULL_URL = BASE_URL + REGISTER_ENDPOINT
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def verify_product_registration_required_fields_validation():
    # Prepare test cases with missing required fields
    test_payloads = [
        # Missing productName
        {
            "wholesalePrice": 1000,
            "price": 1500,
            "platform": "rocket"
        },
        # Missing wholesalePrice
        {
            "productName": "Test Product",
            "price": 1500,
            "platform": "wing"
        },
        # Missing price
        {
            "productName": "Test Product",
            "wholesalePrice": 1000,
            "platform": "consignment"
        },
        # Missing all required fields
        {
            "platform": "rocket"
        }
    ]

    for payload in test_payloads:
        try:
            response = requests.post(FULL_URL, json=payload, headers=HEADERS, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request failed with exception: {e}"

        # Assert that the response status code is 400 Bad Request
        assert response.status_code == 400, (
            f"Expected status code 400 for payload {payload}, but got {response.status_code}"
        )

        # Optionally, verify response content contains appropriate error messages
        # Assuming error response is JSON with 'error' or 'message' fields
        try:
            data = response.json()
        except ValueError:
            data = None

        if data:
            message_found = False
            # Check keys that might hold error messages
            for key in ["error", "message", "errors"]:
                if key in data:
                    message_found = True
                    # Check message contains info about missing required fields
                    msg = str(data[key]).lower()
                    missing_keys = [field for field in ["productname", "wholesaleprice", "price"] if field in msg]
                    assert missing_keys, (
                        f"Error message does not mention missing required fields: {data[key]}"
                    )
                    break
            assert message_found, "Error message not found in response body"
        else:
            # If no JSON body, test at least the status code (already checked)
            pass

verify_product_registration_required_fields_validation()